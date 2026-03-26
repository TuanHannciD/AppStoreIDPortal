/**
 * Lấy metadata public của share link.
 * Dùng khi user mở page /share/[code].
 */
export async function fetchShareLinkByCode(code) {
  const res = await fetch(`/api/share-pages/by-code/${code}`, {
    method: "GET",
    cache: "no-store",
  });

  return res.json();
}

/**
 * Verify pass nhưng chưa trừ quota theo flow mới.
 */
export async function verifySharePass(code, payload) {
  const res = await fetch(`/api/share-pages/by-code/${code}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return res.json();
}

/**
 * Kiểm tra token verify còn hợp lệ trước khi cho qua bước reveal.
 */
export async function validateShareAccessToken(code, payload) {
  const res = await fetch(`/api/share-pages/by-code/${code}/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return res.json();
}

/**
 * Reveal full account info và trừ quota tại server.
 */
export async function revealShareAccount(code, payload) {
  const res = await fetch(`/api/share-pages/by-code/${code}/reveal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return res.json();
}
