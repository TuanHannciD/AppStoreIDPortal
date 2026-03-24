/**
 * API client riêng cho module App Accounts.
 */

export async function fetchAppsForAccounts() {
  const res = await fetch("/api/apps", {
    method: "GET",
    cache: "no-store",
  });
  return res.json();
}

export async function fetchApiSources() {
  const res = await fetch("/api/account-sources", {
    method: "GET",
    cache: "no-store",
  });
  return res.json();
}

export async function fetchAppAccountsByApp(appId) {
  if (!appId) {
    return { success: true, app: null, accounts: [] };
  }

  const res = await fetch(`/api/apps/by-id/${appId}/accounts`, {
    method: "GET",
    cache: "no-store",
  });
  return res.json();
}

export async function createAppAccount(appId, payload) {
  const res = await fetch(`/api/apps/by-id/${appId}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateAppAccount(appId, accountId, payload) {
  const res = await fetch(`/api/apps/by-id/${appId}/accounts/${accountId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteAppAccount(
  appId,
  accountId,
  { force = false, reason = "" } = {},
) {
  const query = force ? "?force=1" : "";
  const res = await fetch(`/api/apps/by-id/${appId}/accounts/${accountId}${query}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });

  const data = await res.json().catch(() => null);
  return {
    success: res.ok && data?.ok,
    blocked: res.status === 409,
    message: data?.message,
    mode: data?.mode || (force ? "FORCE_DELETE" : "SAFE_DELETE"),
    dependencySummary: data?.dependencySummary || null,
  };
}

export async function syncAppAccount(appId, accountId) {
  const res = await fetch(`/api/apps/by-id/${appId}/accounts/${accountId}/sync`, {
    method: "POST",
  });

  const data = await res.json().catch(() => null);
  return {
    success: res.ok && data?.success,
    message: data?.message,
    detail: data?.detail,
    item: data?.item || null,
  };
}
