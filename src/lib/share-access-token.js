import crypto from "crypto";

const SHARE_ACCESS_TOKEN_ISSUER =
  process.env.SHARE_ACCESS_TOKEN_ISSUER || "appstore-id-portal-ui/share-access";
const SHARE_ACCESS_TOKEN_EXPIRES_IN_SEC = Number(
  process.env.SHARE_ACCESS_TOKEN_EXPIRES_IN_SEC || 30,
);

function getShareAccessTokenSecret() {
  const secret =
    process.env.SHARE_ACCESS_TOKEN_SECRET || process.env.AUTH_JWT_SECRET;

  if (!secret) {
    throw new Error("Missing SHARE_ACCESS_TOKEN_SECRET");
  }

  return secret;
}

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64");
}

function signTokenPart(headerPart, payloadPart) {
  return crypto
    .createHmac("sha256", getShareAccessTokenSecret())
    .update(`${headerPart}.${payloadPart}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createShareAccessToken({ shareLinkId, sharePassId, code }) {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    iss: SHARE_ACCESS_TOKEN_ISSUER,
    iat: nowSec,
    exp: nowSec + SHARE_ACCESS_TOKEN_EXPIRES_IN_SEC,
    shareLinkId: String(shareLinkId),
    sharePassId: String(sharePassId),
    code: String(code),
  };

  const headerPart = toBase64Url(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  );
  const payloadPart = toBase64Url(JSON.stringify(payload));
  const signaturePart = signTokenPart(headerPart, payloadPart);

  return {
    token: `${headerPart}.${payloadPart}.${signaturePart}`,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };
}

export function verifyShareAccessToken(token) {
  const rawToken = String(token || "").trim();
  if (!rawToken) return null;

  const parts = rawToken.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signaturePart] = parts;

  try {
    const expectedSignature = signTokenPart(headerPart, payloadPart);
    const actualBuffer = Buffer.from(signaturePart);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      actualBuffer.length !== expectedBuffer.length
      || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }

    const header = JSON.parse(fromBase64Url(headerPart).toString("utf8"));
    const payload = JSON.parse(fromBase64Url(payloadPart).toString("utf8"));

    if (header?.alg !== "HS256" || header?.typ !== "JWT") {
      return null;
    }

    if (payload?.iss !== SHARE_ACCESS_TOKEN_ISSUER) {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload?.exp !== "number" || payload.exp <= nowSec) {
      return null;
    }

    if (!payload?.shareLinkId || !payload?.sharePassId || !payload?.code) {
      return null;
    }

    return {
      shareLinkId: payload.shareLinkId,
      sharePassId: payload.sharePassId,
      code: payload.code,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
    };
  } catch {
    return null;
  }
}
