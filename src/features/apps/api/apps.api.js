async function toJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchApps() {
  const res = await fetch("/api/apps", { cache: "no-store" });
  return toJson(res);
}

export async function createApp(payload) {
  const res = await fetch("/api/apps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await toJson(res);
  return {
    success: res.ok && data?.success,
    message: data?.message,
    item: data?.item || null,
  };
}

export async function updateApp(appId, payload) {
  const res = await fetch(`/api/apps/by-id/${appId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await toJson(res);
  return {
    success: res.ok && data?.ok,
    message: data?.message,
    item: data?.item || null,
  };
}

export async function deleteApp(appId, { force = false, reason = "" } = {}) {
  const query = force ? "?force=1" : "";
  const res = await fetch(`/api/apps/by-id/${appId}${query}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });

  const data = await toJson(res);
  return {
    success: res.ok && data?.ok,
    blocked: res.status === 409,
    message: data?.message,
    mode: data?.mode || (force ? "FORCE_DELETE" : "SAFE_DELETE"),
    dependencySummary: data?.dependencySummary || null,
  };
}
