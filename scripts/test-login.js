import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
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

  const testEmail = "admin@example.com";
  const testPassword = "change-me";

  console.log(`Testing login for: ${testEmail}`);
  console.log(`Password: ${testPassword}`);
  console.log();

  const userId = userEmails.get(testEmail);
  if (!userId) {
    console.log("❌ User not found by email");
    root.close();
    return;
  }

  console.log(`✅ Found user ID: ${userId}`);

  const user = users.get(userId);
  if (!user) {
    console.log("❌ User data not found");
    root.close();
    return;
  }

  console.log(`✅ User data:`);
  console.log(JSON.stringify({ email: user.email, role: user.role }, null, 2));
  console.log();

  const passwordMatch = await bcrypt.compare(testPassword, user.passwordHash);
  if (passwordMatch) {
    console.log("✅ Password matches!");
  } else {
    console.log("❌ Password does NOT match");
    console.log("This means the password in .env is different from what was used during seed");
  }

  root.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
