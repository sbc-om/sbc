#!/usr/bin/env node
/**
 * Seed AI Agent Builder products into the products table.
 * Run: node scripts/seed-agent-builder-products.js
 *
 * Uses ON CONFLICT to safely upsert — can be re-run without duplication.
 */
import pg from "pg";
import { nanoid } from "nanoid";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/sbc";

const pool = new pg.Pool({ connectionString: databaseUrl });

const AGENT_BUILDER_PRODUCTS = [
  {
    slug: "agent-builder-starter-monthly",
    program: "agent-builder",
    plan: "starter-monthly",
    durationDays: 30,
    name: {
      en: "AI Agent Builder - Starter",
      ar: "منشئ الوكيل الذكي - المبتدئ",
    },
    description: {
      en: "Build a simple AI agent for your business with up to 8 workflow nodes.",
      ar: "أنشئ وكيلاً ذكياً بسيطاً لنشاطك التجاري مع حتى ٨ عقد في سير العمل.",
    },
    price: 3,
    currency: "OMR",
    features: [
      "1 AI agent",
      "Up to 8 workflow nodes",
      "Chat trigger",
      "Basic AI model access",
      "100 executions/month",
      "Community support",
    ],
    badges: [],
    sortOrder: 40,
  },
  {
    slug: "agent-builder-professional-monthly",
    program: "agent-builder",
    plan: "professional-monthly",
    durationDays: 30,
    name: {
      en: "AI Agent Builder - Professional",
      ar: "منشئ الوكيل الذكي - الاحترافي",
    },
    description: {
      en: "Create up to 5 advanced AI agents with webhooks, code execution, and memory.",
      ar: "أنشئ حتى ٥ وكلاء ذكيين متقدمين مع ويب هوكس وتنفيذ الكود والذاكرة.",
    },
    price: 8,
    currency: "OMR",
    features: [
      "Up to 5 AI agents",
      "Up to 25 workflow nodes per agent",
      "Webhooks & HTTP requests",
      "Code executor node",
      "Agent memory & context",
      "1,000 executions/month",
      "Email & chat support",
    ],
    badges: ["Popular"],
    sortOrder: 41,
  },
  {
    slug: "agent-builder-enterprise-monthly",
    program: "agent-builder",
    plan: "enterprise-monthly",
    durationDays: 30,
    name: {
      en: "AI Agent Builder - Enterprise",
      ar: "منشئ الوكيل الذكي - المتقدم",
    },
    description: {
      en: "Unlimited AI agents with all node types, scheduled triggers, analytics, and priority support.",
      ar: "وكلاء غير محدودين مع جميع أنواع العقد والتشغيل المجدول والتحليلات والدعم المميز.",
    },
    price: 15,
    currency: "OMR",
    features: [
      "Unlimited AI agents",
      "Unlimited workflow nodes",
      "All trigger types (chat, webhook, schedule)",
      "Advanced AI models (GPT-4, Claude)",
      "Code executor & JSON parser",
      "Conditional logic & branching",
      "Unlimited executions",
      "Analytics & execution logs",
      "Priority support",
    ],
    badges: ["Best Value"],
    sortOrder: 42,
  },
];

async function main() {
  const client = await pool.connect();
  console.log("🤖 Seeding AI Agent Builder products...\n");

  try {
    for (const p of AGENT_BUILDER_PRODUCTS) {
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

    console.log("\n🎉 Done — 3 AI Agent Builder products seeded.");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
