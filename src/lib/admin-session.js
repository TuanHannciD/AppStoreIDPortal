import { cookies } from "next/headers";
import { isAdminRole } from "@/lib/admin-auth";

export const SESSION_COOKIE_NAME = "admin_access_token";
export const JWT_ALGORITHM = process.env.AUTH_JWT_ALGORITHM || "HS256";
export const JWT_ISSUER =
  process.env.AUTH_JWT_ISSUER || "appstore-id-portal-ui";
export const JWT_EXPIRES_IN_SEC = Number(
  process.env.AUTH_JWT_EXPIRES_IN_SEC || 60 * 60 * 8,
);

function getJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_JWT_SECRET");
  }
  return secret;
}

function toBase64UrlFromBytes(bytes) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  if (typeof btoa === "function") {
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  return Buffer.from(binary, "binary")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function toBase64UrlFromText(value) {
  return toBase64UrlFromBytes(new TextEncoder().encode(value));
}

function fromBase64UrlToBinary(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);

  if (typeof atob === "function") {
    return atob(padded);
  }

  return Buffer.from(padded, "base64").toString("binary");
}

function decodeJsonBase64Url(value) {
  const binary = fromBase64UrlToBinary(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function importHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getJwtSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signJwtParts(headerPart, payloadPart) {
  const key = await importHmacKey();
  const data = `${headerPart}.${payloadPart}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );

  return toBase64UrlFromBytes(new Uint8Array(signature));
}

/**
 * Tạo JWT access token cho admin.
 *
 * Payload chỉ chứa thông tin cần cho middleware và server component:
 * - sub: user id
 * - email: hiển thị lời chào
 * - role: middleware tự xác minh quyền
 * - iss / iat / exp: hỗ trợ debug và kiểm soát thời hạn
 */
export async function createAdminAccessToken(user) {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(user.id),
    email: String(user.email),
    role: String(user.role),
    iss: JWT_ISSUER,
    iat: nowSec,
    exp: nowSec + JWT_EXPIRES_IN_SEC,
  };

  const headerPart = toBase64UrlFromText(
    JSON.stringify({ alg: JWT_ALGORITHM, typ: "JWT" }),
  );
  const payloadPart = toBase64UrlFromText(JSON.stringify(payload));
  const signaturePart = await signJwtParts(headerPart, payloadPart);

  return `${headerPart}.${payloadPart}.${signaturePart}`;
}

/**
 * Verify token ở mọi nơi dùng chung:
 * - middleware
 * - server component
 * - API route
 *
 * Hàm này không query DB nên chạy ổn trong edge runtime.
 */
export async function verifyAdminAccessToken(token) {
  const rawToken = String(token || "").trim();
  if (!rawToken) return null;

  const parts = rawToken.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signaturePart] = parts;

  try {
    const header = decodeJsonBase64Url(headerPart);
    const payload = decodeJsonBase64Url(payloadPart);

    if (header?.alg !== JWT_ALGORITHM || header?.typ !== "JWT") {
      return null;
    }

    if (payload?.iss !== JWT_ISSUER) {
      return null;
    }

    if (!payload?.sub || !payload?.email || !isAdminRole(payload?.role)) {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp <= nowSec) {
      return null;
    }

    const key = await importHmacKey();
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(
        fromBase64UrlToBinary(signaturePart),
        (char) => char.charCodeAt(0),
      ),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`),
    );

    if (!validSignature) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
    };
  } catch {
    return null;
  }
}

export async function getCurrentAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifyAdminAccessToken(token);
}
