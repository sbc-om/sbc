#!/usr/bin/env node
/**
 * Seed business email products into the products table.
 * Run: node scripts/seed-email-products.js
 *
 * Uses ON CONFLICT to safely upsert — can be re-run without duplication.
 */
import pg from "pg";
import { nanoid } from "nanoid";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/sbc";

const pool = new pg.Pool({ connectionString: databaseUrl });

const EMAIL_PRODUCTS = [
  {
    slug: "email-starter-monthly",
    program: "email",
    plan: "starter-monthly",
    durationDays: 30,
    name: { en: "Business Email - Starter", ar: "البريد المؤسسي - المبتدئ" },
    description: {
      en: "Professional email with your own domain — up to 5 accounts.",
      ar: "بريد إلكتروني مؤسسي بنطاقك الخاص — حتى 5 حسابات.",
    },
    price: 2,
    currency: "OMR",
    features: [
      "1 custom domain",
      "Up to 5 email accounts",
      "5 GB storage per account",
      "Webmail access",
      "IMAP/SMTP support",
    ],
    badges: [],
    sortOrder: 40,
  },
  {
    slug: "email-professional-monthly",
    program: "email",
    plan: "professional-monthly",
    durationDays: 30,
    name: { en: "Business Email - Professional", ar: "البريد المؤسسي - الاحترافي" },
    description: {
      en: "Professional email with your own domain — up to 25 accounts with more storage.",
      ar: "بريد إلكتروني مؤسسي بنطاقك الخاص — حتى 25 حساباً مع مساحة أكبر.",
    },
    price: 5,
    currency: "OMR",
    features: [
      "Up to 3 custom domains",
      "Up to 25 email accounts",
      "15 GB storage per account",
      "Webmail access",
      "IMAP/SMTP support",
      "Email aliases",
      "Priority support",
    ],
    badges: ["Popular"],
    sortOrder: 41,
  },
  {
    slug: "email-enterprise-monthly",
    program: "email",
    plan: "enterprise-monthly",
    durationDays: 30,
    name: { en: "Business Email - Enterprise", ar: "البريد المؤسسي - المتقدم" },
    description: {
      en: "Unlimited email accounts with enterprise features and dedicated support.",
      ar: "حسابات بريد غير محدودة مع ميزات متقدمة ودعم مخصص.",
    },
    price: 10,
    currency: "OMR",
    features: [
      "Unlimited custom domains",
      "Unlimited email accounts",
      "50 GB storage per account",
      "Webmail access",
      "IMAP/SMTP support",
      "Email aliases & groups",
      "Admin panel",
      "Dedicated support",
    ],
    badges: ["Best Value"],
    sortOrder: 42,
  },
];

async function main() {
  const client = await pool.connect();
  console.log("📧 Seeding business email products...\n");

  try {
    for (const p of EMAIL_PRODUCTS) {
      const id = nanoid();
      const now = new Date();

      await client.query(
        `INSERT INTO products (
          id, slug, name_en, name_ar, description_en, description_ar,
          price, currency, program, plan, duration_days,
          features, badges, is_active, sort_order, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16)
        ON CONFLICT (slug) DO UPDATE SET
          name_en = EXCLUDED.name_en,
          name_ar = EXCLUDED.name_ar,
          description_en = EXCLUDED.description_en,
          description_ar = EXCLUDED.description_ar,
          price = EXCLUDED.price,
          currency = EXCLUDED.currency,
          program = EXCLUDED.program,
          plan = EXCLUDED.plan,
          duration_days = EXCLUDED.duration_days,
          features = EXCLUDED.features,
          badges = EXCLUDED.badges,
          sort_order = EXCLUDED.sort_order,
          updated_at = EXCLUDED.updated_at`,
        [
          id,
          p.slug,
          p.name.en,
          p.name.ar,
          p.description.en,
          p.description.ar,
          p.price,
          p.currency,
          p.program,
          p.plan,
          p.durationDays,
          JSON.stringify(p.features),
          JSON.stringify(p.badges),
          true,
          p.sortOrder,
          now,
        ]
      );
      console.log(`  ✅ ${p.slug}  (${p.price} ${p.currency})`);
    }

    console.log("\n🎉 Done — 3 business email products seeded.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
