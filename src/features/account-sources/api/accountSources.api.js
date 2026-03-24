export async function fetchAccountSources() {
  const res = await fetch("/api/account-sources", {
    method: "GET",
    cache: "no-store",
  });
  return res.json();
}

export async function createAccountSource(payload) {
  const res = await fetch("/api/account-sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateAccountSource(id, payload) {
  const res = await fetch(`/api/account-sources/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function runAccountSourceNow(id) {
  const res = await fetch(`/api/account-sources/${id}/run-now`, {
    method: "POST",
  });
  return res.json();
}

export async function deleteAccountSource(id) {
  const res = await fetch(`/api/account-sources/${id}`, {
    method: "DELETE",
  });

  const data = await res.json().catch(() => null);
  return {
    success: res.ok && data?.success,
    blocked: res.status === 409,
    message: data?.message,
    dependencySummary: data?.dependencySummary || null,
  };
}
