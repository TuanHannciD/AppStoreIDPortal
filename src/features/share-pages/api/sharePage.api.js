export async function fetchApps() {
  const res = await fetch("/api/apps", { cache: "no-store" });
  return res.json();
}

export async function fetchAppAccounts(appId) {
  if (!appId) {
    return { success: true, accounts: [] };
  }

  const res = await fetch(`/api/apps/by-id/${appId}/accounts`, {
    method: "GET",
    cache: "no-store",
  });

  return res.json();
}

export async function createSharePage(payload) {
  const res = await fetch("/api/share-pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchSharePages() {
  const res = await fetch("/api/share-pages", {
    method: "GET",
    cache: "no-store",
  });
  return res.json();
}

export async function fetchSharePageDetail(id) {
  const res = await fetch(`/api/share-pages/${id}`, {
    method: "GET",
    cache: "no-store",
  });
  return res.json();
}

export async function fetchSharePagePasses(id) {
  const res = await fetch(`/api/share-pages/${id}/passes`, {
    method: "GET",
    cache: "no-store",
  });
  return res.json();
}

export async function updateSharePage(id, payload) {
  const res = await fetch(`/api/share-pages/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteSharePage(id, { force = false, reason = "" } = {}) {
  const query = force ? "?force=1" : "";
  const res = await fetch(`/api/share-pages/${id}${query}`, {
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

export async function createSharePass(id, payload) {
  const res = await fetch(`/api/share-pages/${id}/passes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateSharePass(sharePageId, passId, payload) {
  const res = await fetch(`/api/share-pages/${sharePageId}/passes/${passId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteSharePass(
  sharePageId,
  passId,
  { force = false, reason = "" } = {},
) {
  const query = force ? "?force=1" : "";
  const res = await fetch(
    `/api/share-pages/${sharePageId}/passes/${passId}${query}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    },
  );

  const data = await res.json().catch(() => null);
  return {
    success: res.ok && data?.ok,
    blocked: res.status === 409,
    message: data?.message,
    mode: data?.mode || (force ? "FORCE_DELETE" : "SAFE_DELETE"),
    dependencySummary: data?.dependencySummary || null,
  };
}

export async function fetchSharePageAccounts(sharePageId) {
  const res = await fetch(`/api/share-pages/${sharePageId}/accounts`, {
    method: "GET",
    cache: "no-store",
  });
  return res.json();
}

export async function updateSharePageAccount(sharePageId, payload) {
  const res = await fetch(`/api/share-pages/${sharePageId}/accounts`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
