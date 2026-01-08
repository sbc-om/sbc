import fs from "node:fs";
import path from "node:path";
import { open } from "lmdb";

function loadDotenvIfPresent() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const idx = line.indexOf("=");
    if (idx < 0) continue;

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    if (process.env[key] !== undefined) continue;

    process.env[key] = value;
  }
}

function resolveDbPath() {
  const p = process.env.LMDB_PATH || ".data/lmdb";
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

async function main() {
  loadDotenvIfPresent();

  const dbPath = resolveDbPath();
  const root = open({ path: dbPath, compression: true });
  const users = root.openDB({ name: "users" });
  const userEmails = root.openDB({ name: "userEmails" });
  const businesses = root.openDB({ name: "businesses" });
  const businessSlugs = root.openDB({ name: "businessSlugs" });

  console.log("=== USERS ===");
  let userCount = 0;
  for (const entry of users.getRange()) {
    const { key: id, value: user } = entry;
    console.log(JSON.stringify({ id, email: user.email, role: user.role }, null, 2));
    userCount++;
  }
  console.log(`Total users: ${userCount}\n`);

  console.log("=== BUSINESSES ===");
  let bizCount = 0;
  for (const entry of businesses.getRange()) {
    const { key: id, value: biz } = entry;
    console.log(JSON.stringify({ id, slug: biz.slug, name: biz.name }, null, 2));
    bizCount++;
  }
  console.log(`Total businesses: ${bizCount}\n`);

  root.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
