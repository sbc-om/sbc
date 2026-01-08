import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
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

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

async function main() {
  loadDotenvIfPresent();

  const dbPath = resolveDbPath();
  fs.mkdirSync(dbPath, { recursive: true });

  const root = open({ path: dbPath, compression: true });
  const users = root.openDB({ name: "users" });
  const userEmails = root.openDB({ name: "userEmails" });
  const businesses = root.openDB({ name: "businesses" });
  const businessSlugs = root.openDB({ name: "businessSlugs" });

  const adminEmail = requireEnv("ADMIN_EMAIL").trim().toLowerCase();
  const adminPassword = requireEnv("ADMIN_PASSWORD");

  const existingAdminId = userEmails.get(adminEmail);
  if (!existingAdminId) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = {
      id: nanoid(),
      email: adminEmail,
      passwordHash,
      role: "admin",
      createdAt: new Date().toISOString(),
    };

    users.put(admin.id, admin);
    userEmails.put(adminEmail, admin.id);
    console.log(`Created admin: ${adminEmail}`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  // Seed a couple of sample businesses if empty
  let count = 0;
  for (const entry of businesses.getRange()) {
    void entry;
    count++;
  }

  if (count === 0) {
    const now = new Date().toISOString();

    const seed = [
      {
        slug: "al-noor-cafe",
        name: { en: "Al Noor Cafe", ar: "مقهى النور" },
        description: {
          en: "Specialty coffee, quiet seating, and fast Wi‑Fi.",
          ar: "قهوة مختصة، جلسات هادئة، وإنترنت سريع.",
        },
        category: "Cafe",
        city: "Muscat",
        tags: ["coffee", "wifi"],
      },
      {
        slug: "sbc-legal",
        name: { en: "SBC Legal", ar: "إس بي سي للخدمات القانونية" },
        description: {
          en: "Business-friendly legal services and consultations.",
          ar: "خدمات واستشارات قانونية مناسبة للأعمال.",
        },
        category: "Legal",
        city: "Muscat",
        tags: ["legal", "business"],
      },
    ];

    for (const s of seed) {
      const id = nanoid();
      const b = {
        id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        category: s.category,
        city: s.city,
        tags: s.tags,
        createdAt: now,
        updatedAt: now,
      };
      businesses.put(id, b);
      businessSlugs.put(s.slug, id);
    }

    console.log("Seeded sample businesses.");
  } else {
    console.log("Businesses already exist; skipping seed.");
  }

  root.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
