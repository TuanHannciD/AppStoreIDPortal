export async function createShareLink(payload) {
  const res = await fetch("/api/share-pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchShareLinks() {
  const res = await fetch("/api/share-pages", {
    method: "GET",
    cache: "no-store",
  });
  return res.json();
}

export async function fetchShareLinkDetail(id) {
  const res = await fetch(`/api/share-pages/${id}`, {
    method: "GET",
    cache: "no-store",
  });
  return res.json();
}

export async function fetchShareLinkPasses(id) {
  const res = await fetch(`/api/share-pages/${id}/passes`, {
    method: "GET",
    cache: "no-store",
  });
  return res.json();
}

export async function updateShareLink(id, payload) {
  const res = await fetch(`/api/share-pages/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteShareLink(id, { force = false, reason = "" } = {}) {
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

export async function updateShareLinkPass(shareLinkId, passId, payload) {
  const res = await fetch(`/api/share-pages/${shareLinkId}/passes/${passId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteShareLinkPass(
  shareLinkId,
  passId,
  { force = false, reason = "" } = {},
) {
  const query = force ? "?force=1" : "";
  const res = await fetch(
    `/api/share-pages/${shareLinkId}/passes/${passId}${query}`,
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
