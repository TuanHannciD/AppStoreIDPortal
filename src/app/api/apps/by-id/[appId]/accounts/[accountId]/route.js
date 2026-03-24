import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentAdminSession } from "@/lib/admin-session";
import {
  getAppAccountDependencySummary,
  hasAppAccountDependencies,
} from "@/lib/app-account-delete";

const UpdateAppAccountSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  username: z.string().max(200).optional().nullable(),
  password: z.string().max(500).optional().nullable(),
  twoFaKey: z.string().max(500).optional().nullable(),
  backupCode: z.string().max(2000).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
  apiSourceConfigId: z.string().max(191).optional().nullable(),
  externalKey: z.string().max(200).optional().nullable(),
});

function mapAppAccount(item) {
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

function parseDeleteMode(req) {
  const forceValue = req.nextUrl.searchParams.get("force");
  return forceValue === "1" || forceValue === "true"
    ? "FORCE_DELETE"
    : "SAFE_DELETE";
}

async function parseDeleteBody(req) {
  try {
    const body = await req.json();
    return {
      reason: String(body?.reason || "").trim() || null,
    };
  } catch {
    return { reason: null };
  }
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();
    const parsed = UpdateAppAccountSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const existing = await prisma.appAccount.findFirst({
      where: {
        id: params.accountId,
        appId: params.appId,
      },
    });

    if (!existing) {
      return Response.json(
        { success: false, message: "App account not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.appAccount.update({
      where: { id: existing.id },
      data: {
        title: parsed.data.title?.trim() || null,
        email: parsed.data.email?.trim() || null,
        username: parsed.data.username?.trim() || null,
        password: parsed.data.password?.trim() || null,
        twoFaKey: parsed.data.twoFaKey?.trim() || null,
        backupCode: parsed.data.backupCode?.trim() || null,
        note: parsed.data.note?.trim() || null,
        isActive: parsed.data.isActive ?? existing.isActive,
        apiSourceConfigId: parsed.data.apiSourceConfigId?.trim() || null,
        externalKey: parsed.data.externalKey?.trim() || null,
      },
    });

    return Response.json({
      success: true,
      item: mapAppAccount(updated),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Failed to update app account",
        detail: String(error?.message || error),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const session = await getCurrentAdminSession();
  if (!session) {
    return Response.json(
      { ok: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  const appId = String(params?.appId || "").trim();
  const accountId = String(params?.accountId || "").trim();

  if (!appId || !accountId) {
    return Response.json(
      { ok: false, message: "App account not found." },
      { status: 404 },
    );
  }

  const mode = parseDeleteMode(req);
  const { reason } = await parseDeleteBody(req);

  const existing = await prisma.appAccount.findFirst({
    where: {
      id: accountId,
      appId,
    },
    select: {
      id: true,
      title: true,
      email: true,
      appId: true,
      app: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!existing) {
    return Response.json(
      { ok: false, message: "App account not found." },
      { status: 404 },
    );
  }

  const dependencySummary = await getAppAccountDependencySummary(existing.id);

  if (mode === "SAFE_DELETE" && hasAppAccountDependencies(dependencySummary)) {
    await prisma.appAccountDeleteLog.create({
      data: {
        actorUserId: session.userId,
        actorEmail: session.email,
        appAccountId: existing.id,
        appAccountTitle: existing.title,
        appAccountEmail: existing.email,
        appId: existing.appId,
        appName: existing.app?.name || "-",
        mode: "SAFE_DELETE",
        status: "BLOCKED",
        reason,
        dependencySummary,
      },
    });

    return Response.json(
      {
        ok: false,
        message: "Cannot delete this account because dependent records still exist.",
        mode,
        dependencySummary,
      },
      { status: 409 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.appAccount.delete({
        where: { id: existing.id },
      });

      await tx.appAccountDeleteLog.create({
        data: {
          actorUserId: session.userId,
          actorEmail: session.email,
          appAccountId: existing.id,
          appAccountTitle: existing.title,
          appAccountEmail: existing.email,
          appId: existing.appId,
          appName: existing.app?.name || "-",
          mode,
          status: "DELETED",
          reason,
          dependencySummary,
        },
      });
    });

    return Response.json({
      ok: true,
      message:
        mode === "FORCE_DELETE"
          ? "App account and all dependent records were deleted."
          : "App account deleted successfully.",
      mode,
      dependencySummary,
    });
  } catch (error) {
    await prisma.appAccountDeleteLog.create({
      data: {
        actorUserId: session.userId,
        actorEmail: session.email,
        appAccountId: existing.id,
        appAccountTitle: existing.title,
        appAccountEmail: existing.email,
        appId: existing.appId,
        appName: existing.app?.name || "-",
        mode,
        status: "FAILED",
        reason: reason || String(error?.message || "Unknown delete error"),
        dependencySummary,
      },
    });

    return Response.json(
      { ok: false, message: "Failed to delete app account." },
      { status: 500 },
    );
  }
}
