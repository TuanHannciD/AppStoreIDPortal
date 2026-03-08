export async function fetchApps() {
  const res = await fetch("/api/apps", { cache: "no-store" });
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

// Wapper cho get List data
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

export async function createSharePass(id, payload) {
  const res = await fetch(`/api/share-pages/${id}/passes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}