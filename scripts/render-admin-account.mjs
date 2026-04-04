import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAdminUserRecord,
  renderAdminUserSql,
} from "../src/lib/admin-auth.js";
import { isAdminRole, normalizeEmail } from "../src/lib/admin-auth-shared.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node scripts/render-admin-account.mjs --email admin@example.com --password secret123",
      "  node scripts/render-admin-account.mjs --email admin@example.com --password secret123 --role ADMIN --format sql --out tmp/admin-user.sql",
    ].join("\n"),
  );
}

function getArg(name, fallback = "") {
  const key = `--${name}`;
  const index = process.argv.indexOf(key);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

async function main() {
  const email = normalizeEmail(getArg("email"));
  const password = getArg("password");
  const role = String(getArg("role", "SUPER_ADMIN")).trim().toUpperCase();
  const format = String(getArg("format", "json")).trim().toLowerCase();
  const outArg = getArg("out");

  if (!email || !password) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (!isAdminRole(role)) {
    console.error('Role must be "SUPER_ADMIN" or "ADMIN".');
    process.exitCode = 1;
    return;
  }

  if (!["json", "sql"].includes(format)) {
    console.error('Format must be "json" or "sql".');
    process.exitCode = 1;
    return;
  }

  const record = await createAdminUserRecord({ email, password, role });
  const output =
    format === "sql"
      ? renderAdminUserSql(record)
      : `${JSON.stringify(record, null, 2)}\n`;

  const defaultName = format === "sql" ? "admin-user.sql" : "admin-user.json";
  const outputPath = path.resolve(workspaceRoot, outArg || `tmp/${defaultName}`);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, output, "utf8");

  console.log(`Wrote ${format.toUpperCase()} output to ${outputPath}`);
}

main().catch((error) => {
  console.error("render_admin_account_failed", error);
  process.exitCode = 1;
});

