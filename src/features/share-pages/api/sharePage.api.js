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
