import crypto from "crypto";

export const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

export function sha256(text) {
  return crypto.createHash("sha256").update(String(text)).digest("hex");
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isAdminRole(role) {
  return ADMIN_ROLES.has(String(role || ""));
}

export function createAdminUserRecord({ email, password, role = "SUPER_ADMIN" }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = String(role || "SUPER_ADMIN").trim().toUpperCase();

  return {
    email: normalizedEmail,
    password: sha256(password),
    role: normalizedRole,
  };
}

function escapeSqlValue(value) {
  return String(value).replace(/'/g, "''");
}

export function renderAdminUserSql(record) {
  return [
    "INSERT INTO \"User\" (\"email\", \"password\", \"role\")",
    `VALUES ('${escapeSqlValue(record.email)}', '${escapeSqlValue(record.password)}', '${escapeSqlValue(record.role)}');`,
  ].join("\n");
}
