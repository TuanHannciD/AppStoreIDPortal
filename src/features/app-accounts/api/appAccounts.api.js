/**
 * API client riêng cho module App Accounts.
 *
 * Tách file này ra để màn CRUD account không phụ thuộc vào feature share-pages.
 */

export async function fetchAppsForAccounts() {
  const res = await fetch("/api/apps", {
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

export async function deleteAppAccount(appId, accountId) {
  const res = await fetch(`/api/apps/by-id/${appId}/accounts/${accountId}`, {
    method: "DELETE",
  });
  return res.json();
}
