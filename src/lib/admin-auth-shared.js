export const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isAdminRole(role) {
  return ADMIN_ROLES.has(String(role || ""));
}
