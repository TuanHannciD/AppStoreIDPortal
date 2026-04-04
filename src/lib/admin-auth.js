import crypto from "crypto";
import { normalizeEmail } from "@/lib/admin-auth-shared";

export function sha256(text) {
  return crypto.createHash("sha256").update(String(text)).digest("hex");
}

export async function createAdminUserRecord({ email, password, role = "SUPER_ADMIN" }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = String(role || "SUPER_ADMIN").trim().toUpperCase();
  const bcrypt = await import("bcryptjs");

  return {
    email: normalizedEmail,
    password: await bcrypt.hash(String(password), 10),
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
