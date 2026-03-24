import { prisma } from "@/lib/prisma";

export const SyncStatus = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  SKIPPED: "SKIPPED",
};

export const SyncResultCode = {
  SYNC_SUCCESS: "SYNC_SUCCESS",
  ACCOUNT_MISSING_EXTERNAL_KEY: "ACCOUNT_MISSING_EXTERNAL_KEY",
  ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE",
  SOURCE_CONFIG_MISSING: "SOURCE_CONFIG_MISSING",
  SOURCE_CONFIG_INACTIVE: "SOURCE_CONFIG_INACTIVE",
  SOURCE_HTTP_ERROR: "SOURCE_HTTP_ERROR",
  SOURCE_TIMEOUT: "SOURCE_TIMEOUT",
  SOURCE_INVALID_PAYLOAD: "SOURCE_INVALID_PAYLOAD",
  SOURCE_EMPTY_ACCOUNT: "SOURCE_EMPTY_ACCOUNT",
  SOURCE_ACCOUNT_INACTIVE: "SOURCE_ACCOUNT_INACTIVE",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

function normalizeNullableString(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function buildSourceUrl(baseUrl, externalKey) {
  const normalizedBaseUrl = String(baseUrl || "").trim().replace(/\/+$/, "");
  const normalizedKey = String(externalKey || "").trim().replace(/^\/+/, "");
  return `${normalizedBaseUrl}/${normalizedKey}`;
}

export function mapAppAccount(item) {
  return {
    id: item.id,
    appId: item.appId,
    title: item.title,
    email: item.email,
    username: item.username,
    password: item.password,
    twoFaKey: item.twoFaKey,
    backupCode: item.backupCode,
    note: item.note,
    isActive: item.isActive,
    apiSourceConfigId: item.apiSourceConfigId,
    externalKey: item.externalKey,
    lastSyncedAt: item.lastSyncedAt,
    lastSyncStatus: item.lastSyncStatus,
    lastSyncResultCode: item.lastSyncResultCode,
    lastSyncResultMessage: item.lastSyncResultMessage,
    lastSyncError: item.lastSyncError,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function updateSyncResult(accountId, payload) {
  return prisma.appAccount.update({
    where: { id: accountId },
    data: {
      lastSyncedAt: new Date(),
      lastSyncStatus: payload.status,
      lastSyncResultCode: payload.resultCode,
      lastSyncResultMessage: normalizeNullableString(payload.resultMessage),
      lastSyncError: normalizeNullableString(payload.errorMessage),
      ...(payload.accountData || {}),
    },
    include: {
      apiSourceConfig: true,
    },
  });
}

export async function syncAppAccountById({ appId, accountId }) {
  const account = await prisma.appAccount.findFirst({
    where: {
      id: accountId,
      ...(appId ? { appId } : {}),
    },
    include: {
      apiSourceConfig: true,
    },
  });

  if (!account) {
    return {
      ok: false,
      httpStatus: 404,
      message: "App account not found",
      item: null,
    };
  }

  if (!account.isActive) {
    const skipped = await updateSyncResult(account.id, {
      status: SyncStatus.SKIPPED,
      resultCode: SyncResultCode.ACCOUNT_INACTIVE,
      resultMessage: "App account is inactive",
      errorMessage: null,
    });

    return {
      ok: false,
      httpStatus: 400,
      message: "App account is inactive",
      item: skipped,
    };
  }

  if (!account.apiSourceConfig) {
    const skipped = await updateSyncResult(account.id, {
      status: SyncStatus.SKIPPED,
      resultCode: SyncResultCode.SOURCE_CONFIG_MISSING,
      resultMessage: "API source config is missing",
      errorMessage: null,
    });

    return {
      ok: false,
      httpStatus: 400,
      message: "API source config is missing",
      item: skipped,
    };
  }

  if (!account.apiSourceConfig.isActive) {
    const skipped = await updateSyncResult(account.id, {
      status: SyncStatus.SKIPPED,
      resultCode: SyncResultCode.SOURCE_CONFIG_INACTIVE,
      resultMessage: "API source config is inactive",
      errorMessage: null,
    });

    return {
      ok: false,
      httpStatus: 400,
      message: "API source config is inactive",
      item: skipped,
    };
  }

  if (!account.externalKey) {
    const skipped = await updateSyncResult(account.id, {
      status: SyncStatus.SKIPPED,
      resultCode: SyncResultCode.ACCOUNT_MISSING_EXTERNAL_KEY,
      resultMessage: "External key is required",
      errorMessage: null,
    });

    return {
      ok: false,
      httpStatus: 400,
      message: "External key is required to sync this account",
      item: skipped,
    };
  }

  const sourceUrl = buildSourceUrl(account.apiSourceConfig.baseUrl, account.externalKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(sourceUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const failed = await updateSyncResult(account.id, {
        status: SyncStatus.FAILED,
        resultCode: SyncResultCode.SOURCE_HTTP_ERROR,
        resultMessage: `Source API responded with status ${response.status}`,
        errorMessage: null,
      });

      return {
        ok: false,
        httpStatus: 502,
        message: "Source API request failed",
        item: failed,
      };
    }

    const payload = await response.json().catch(() => null);
    const sourceAccount = payload?.accounts?.[0];

    if (!payload || typeof payload !== "object") {
      const failed = await updateSyncResult(account.id, {
        status: SyncStatus.FAILED,
        resultCode: SyncResultCode.SOURCE_INVALID_PAYLOAD,
        resultMessage: "Source API returned invalid payload",
        errorMessage: null,
      });

      return {
        ok: false,
        httpStatus: 502,
        message: "Source API returned invalid payload",
        item: failed,
      };
    }

    if (!sourceAccount) {
      const failed = await updateSyncResult(account.id, {
        status: SyncStatus.FAILED,
        resultCode: SyncResultCode.SOURCE_EMPTY_ACCOUNT,
        resultMessage: payload?.msg || "Source API returned no account",
        errorMessage: null,
      });

      return {
        ok: false,
        httpStatus: 502,
        message: "Source API returned no account",
        item: failed,
      };
    }

    if (payload?.code !== 200 || payload?.status !== true) {
      const failed = await updateSyncResult(account.id, {
        status: SyncStatus.FAILED,
        resultCode: SyncResultCode.SOURCE_INVALID_PAYLOAD,
        resultMessage: payload?.msg || "Source API returned invalid account data",
        errorMessage: null,
      });

      return {
        ok: false,
        httpStatus: 502,
        message: "Source API returned invalid account data",
        item: failed,
      };
    }

    if (sourceAccount.status === false) {
      const failed = await updateSyncResult(account.id, {
        status: SyncStatus.FAILED,
        resultCode: SyncResultCode.SOURCE_ACCOUNT_INACTIVE,
        resultMessage: sourceAccount.message || payload?.msg || "Source account is inactive",
        errorMessage: null,
      });

      return {
        ok: false,
        httpStatus: 502,
        message: "Source account is inactive",
        item: failed,
      };
    }

    const updated = await updateSyncResult(account.id, {
      status: SyncStatus.SUCCESS,
      resultCode: SyncResultCode.SYNC_SUCCESS,
      resultMessage: payload?.msg || sourceAccount.message || "Synced account successfully",
      errorMessage: null,
      accountData: {
        email: normalizeNullableString(sourceAccount.username) || account.email,
        username: normalizeNullableString(sourceAccount.username),
        password: normalizeNullableString(sourceAccount.password),
        note: normalizeNullableString(sourceAccount.message) || account.note,
        isActive:
          typeof sourceAccount.status === "boolean"
            ? sourceAccount.status
            : account.isActive,
      },
    });

    return {
      ok: true,
      httpStatus: 200,
      message: payload?.msg || "Synced account successfully",
      item: updated,
    };
  } catch (error) {
    const isTimeout = error?.name === "AbortError";
    const failed = await updateSyncResult(account.id, {
      status: SyncStatus.FAILED,
      resultCode: isTimeout
        ? SyncResultCode.SOURCE_TIMEOUT
        : SyncResultCode.UNKNOWN_ERROR,
      resultMessage: isTimeout
        ? "Source API request timed out"
        : "Unexpected sync error",
      errorMessage: String(error?.message || error),
    });

    return {
      ok: false,
      httpStatus: 500,
      message: isTimeout ? "Source API request timed out" : "Failed to sync account",
      detail: String(error?.message || error),
      item: failed,
    };
  } finally {
    clearTimeout(timeout);
  }
}
