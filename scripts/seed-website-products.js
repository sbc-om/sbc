#!/usr/bin/env node
/**
 * Seed website products into the products table.
 * Run: node scripts/seed-website-products.js
 *
 * Uses ON CONFLICT to safely upsert — can be re-run without duplication.
 */
import pg from "pg";
import { nanoid } from "nanoid";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/sbc";

const pool = new pg.Pool({ connectionString: databaseUrl });

const WEBSITE_PRODUCTS = [
  {
    slug: "website-starter-monthly",
    program: "website",
    plan: "starter-monthly",
    durationDays: 30,
    name: { en: "Website Builder - Starter", ar: "منشئ المواقع - المبتدئ" },
    description: {
      en: "Build a simple website with up to 3 pages.",
      ar: "أنشئ موقعاً بسيطاً يحتوي على 3 صفحات.",
    },
    price: 2,
    currency: "OMR",
    features: [
      "Up to 3 pages",
      "SBC subdomain",
      "50 MB storage",
      "SBC branding",
    ],
    badges: [],
    sortOrder: 30,
  },
  {
    slug: "website-professional-monthly",
    program: "website",
    plan: "professional-monthly",
    durationDays: 30,
    name: {
      en: "Website Builder - Professional",
      ar: "منشئ المواقع - الاحترافي",
    },
    description: {
      en: "Professional website with custom domain and up to 15 pages.",
      ar: "موقع احترافي بدامنه مخصص وحتى 15 صفحة.",
    },
    price: 5,
    currency: "OMR",
    features: [
      "Up to 15 pages",
      "Custom domain",
      "500 MB storage",
      "Remove SBC branding",
      "Contact form submissions",
    ],
    badges: ["Popular"],
    sortOrder: 31,
  },
  {
    slug: "website-enterprise-monthly",
    program: "website",
    plan: "enterprise-monthly",
    durationDays: 30,
    name: { en: "Website Builder - Enterprise", ar: "منشئ المواقع - المتقدم" },
    description: {
      en: "Unlimited pages, analytics, and custom code injection.",
      ar: "صفحات غير محدودة، تحليلات، وكود مخصص.",
    },
    price: 10,
    currency: "OMR",
    features: [
      "Unlimited pages",
      "Custom domain",
      "5 GB storage",
      "Analytics integration",
      "Custom HTML/CSS",
      "Priority support",
    ],
    badges: ["Best Value"],
    sortOrder: 32,
  },
];

async function main() {
  const client = await pool.connect();
  console.log("🌐 Seeding website products...\n");

  try {
    for (const p of WEBSITE_PRODUCTS) {
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

    console.log("\n🎉 Done — 3 website products seeded.");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
