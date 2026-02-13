#!/usr/bin/env node
/**
 * Seed PostgreSQL database with initial data
 * Run: node scripts/seed-postgres.js
 * 
 * This seeds: categories, products, and sample businesses
 */
import pg from "pg";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/sbc";

const pool = new pg.Pool({ connectionString: databaseUrl });

// ============================================================================
// PRODUCTS DATA
// ============================================================================
const PRODUCTS = [
  {
    slug: "directory-membership-yearly",
    program: "directory",
    plan: "directory-yearly",
    durationDays: 365,
    name: { en: "Business Directory - Membership", ar: "دليل الأعمال - عضوية" },
    description: { en: "Annual membership in the business directory.", ar: "عضوية سنوية في دليل الأعمال." },
    price: 50,
    currency: "OMR",
    features: ["Directory membership", "Standard listing visibility"],
    badges: [],
    sortOrder: 1,
  },
  {
    slug: "directory-homepage-yearly",
    program: "directory",
    plan: "homepage-yearly",
    durationDays: 365,
    name: { en: "Business Directory - Homepage display", ar: "دليل الأعمال - عرض في الصفحة الرئيسية" },
    description: { en: "Show your business on the homepage (annual).", ar: "عرض نشاطك في الصفحة الرئيسية (سنوي)." },
    price: 100,
    currency: "OMR",
    features: ["Homepage placement", "Higher visibility"],
    badges: [],
    sortOrder: 2,
  },
  {
    slug: "directory-homepage-top-yearly",
    program: "directory",
    plan: "homepage-top-yearly",
    durationDays: 365,
    name: { en: "Business Directory - Top row on homepage", ar: "دليل الأعمال - الصف الأول في الرئيسية" },
    description: { en: "Top row placement on homepage (annual).", ar: "عرض في الصف الأول بالصفحة الرئيسية (سنوي)." },
    price: 200,
    currency: "OMR",
    features: ["Top row on homepage", "Maximum visibility"],
    badges: ["Best"],
    sortOrder: 3,
  },
  {
    slug: "loyalty-monthly",
    program: "loyalty",
    plan: "monthly",
    durationDays: 30,
    name: { en: "Loyalty System - Monthly", ar: "نظام الولاء - شهري" },
    description: { en: "Loyalty system subscription (monthly).", ar: "اشتراك نظام الولاء (شهري)." },
    price: 15,
    currency: "OMR",
    features: ["Customer CRM", "Digital loyalty cards", "Points management"],
    badges: [],
    sortOrder: 10,
  },
  {
    slug: "loyalty-6mo",
    program: "loyalty",
    plan: "6mo",
    durationDays: 180,
    name: { en: "Loyalty System - 6 months", ar: "نظام الولاء - 6 أشهر" },
    description: { en: "Loyalty system subscription (6 months).", ar: "اشتراك نظام الولاء (6 أشهر)." },
    price: 60,
    currency: "OMR",
    features: ["Customer CRM", "Digital loyalty cards", "Points management"],
    badges: ["Save"],
    sortOrder: 11,
  },
  {
    slug: "loyalty-yearly",
    program: "loyalty",
    plan: "yearly",
    durationDays: 365,
    name: { en: "Loyalty System - Yearly", ar: "نظام الولاء - سنوي" },
    description: { en: "Loyalty system subscription (annual).", ar: "اشتراك نظام الولاء (سنوي)." },
    price: 90,
    currency: "OMR",
    features: ["Customer CRM", "Digital loyalty cards", "Points management"],
    badges: ["Best Value"],
    sortOrder: 12,
  },
  {
    slug: "marketing-monthly",
    program: "marketing",
    plan: "monthly",
    durationDays: 30,
    name: { en: "Marketing Platform - Monthly", ar: "منصة التسويق - شهري" },
    description: { en: "Marketing platform subscription (monthly).", ar: "اشتراك منصة التسويق (شهري)." },
    price: 15,
    currency: "OMR",
    features: ["Messaging tools", "Templates", "Basic automations"],
    badges: [],
    sortOrder: 20,
  },
  {
    slug: "marketing-6mo",
    program: "marketing",
    plan: "6mo",
    durationDays: 180,
    name: { en: "Marketing Platform - 6 months", ar: "منصة التسويق - 6 أشهر" },
    description: { en: "Marketing platform subscription (6 months).", ar: "اشتراك منصة التسويق (6 أشهر)." },
    price: 60,
    currency: "OMR",
    features: ["Messaging tools", "Templates", "Basic automations"],
    badges: ["Save"],
    sortOrder: 21,
  },
  {
    slug: "marketing-yearly",
    program: "marketing",
    plan: "yearly",
    durationDays: 365,
    name: { en: "Marketing Platform - Yearly", ar: "منصة التسويق - سنوي" },
    description: { en: "Marketing platform subscription (annual).", ar: "اشتراك منصة التسويق (سنوي)." },
    price: 90,
    currency: "OMR",
    features: ["Messaging tools", "Templates", "Basic automations"],
    badges: ["Best Value"],
    sortOrder: 22,
  },
  // ---------- Website Builder ----------
  {
    slug: "website-starter-monthly",
    program: "website",
    plan: "starter-monthly",
    durationDays: 30,
    name: { en: "Website Builder - Starter", ar: "منشئ المواقع - المبتدئ" },
    description: { en: "Build a simple website with up to 3 pages.", ar: "أنشئ موقعاً بسيطاً يحتوي على 3 صفحات." },
    price: 2,
    currency: "OMR",
    features: ["Up to 3 pages", "SBC subdomain", "50 MB storage", "SBC branding"],
    badges: [],
    sortOrder: 30,
  },
  {
    slug: "website-professional-monthly",
    program: "website",
    plan: "professional-monthly",
    durationDays: 30,
    name: { en: "Website Builder - Professional", ar: "منشئ المواقع - الاحترافي" },
    description: { en: "Professional website with custom domain and up to 15 pages.", ar: "موقع احترافي بدامنه مخصص وحتى 15 صفحة." },
    price: 5,
    currency: "OMR",
    features: ["Up to 15 pages", "Custom domain", "500 MB storage", "Remove SBC branding", "Contact form submissions"],
    badges: ["Popular"],
    sortOrder: 31,
  },
  {
    slug: "website-enterprise-monthly",
    program: "website",
    plan: "enterprise-monthly",
    durationDays: 30,
    name: { en: "Website Builder - Enterprise", ar: "منشئ المواقع - المتقدم" },
    description: { en: "Unlimited pages, analytics, and custom code injection.", ar: "صفحات غير محدودة، تحليلات، وكود مخصص." },
    price: 10,
    currency: "OMR",
    features: ["Unlimited pages", "Custom domain", "5 GB storage", "Analytics integration", "Custom HTML/CSS", "Priority support"],
    badges: ["Best Value"],
    sortOrder: 32,
  },
];

// ============================================================================
// CATEGORIES DATA  
// ============================================================================
const CATEGORIES = [
  // Top-level categories
  { slug: "food-beverage", iconId: "restaurant", name: { en: "Food & Beverage", ar: "الأطعمة والمشروبات" } },
  { slug: "retail-shopping", iconId: "shopping", name: { en: "Retail & Shopping", ar: "البيع بالتجزئة والتسوق" } },
  { slug: "health-medical", iconId: "healthcare", name: { en: "Health & Medical", ar: "الصحة والطب" } },
  { slug: "beauty-wellness", iconId: "beauty", name: { en: "Beauty & Wellness", ar: "التجميل والعناية" } },
  { slug: "education-training", iconId: "education", name: { en: "Education & Training", ar: "التعليم والتدريب" } },
  { slug: "professional-services", iconId: "professional", name: { en: "Professional Services", ar: "الخدمات المهنية" } },
  { slug: "technology-it", iconId: "it", name: { en: "Technology & IT", ar: "التقنية والمعلومات" } },
  { slug: "automotive", iconId: "auto", name: { en: "Automotive", ar: "السيارات" } },
  { slug: "real-estate", iconId: "realestate", name: { en: "Real Estate", ar: "العقارات" } },
  { slug: "travel-tourism", iconId: "travel", name: { en: "Travel & Tourism", ar: "السفر والسياحة" } },
  { slug: "entertainment", iconId: "entertainment", name: { en: "Entertainment", ar: "الترفيه" } },
  { slug: "home-services", iconId: "home", name: { en: "Home Services", ar: "خدمات منزلية" } },
  
  // Sub-categories (Food & Beverage)
  { slug: "restaurants", parentSlug: "food-beverage", iconId: "restaurant", name: { en: "Restaurants", ar: "مطاعم" } },
  { slug: "cafes", parentSlug: "food-beverage", iconId: "cafe", name: { en: "Cafes", ar: "مقاهي" } },
  { slug: "bakeries", parentSlug: "food-beverage", iconId: "restaurant", name: { en: "Bakeries", ar: "مخابز" } },
  { slug: "desserts", parentSlug: "food-beverage", iconId: "gift", name: { en: "Desserts & Sweets", ar: "حلويات" } },
  { slug: "catering", parentSlug: "food-beverage", iconId: "delivery", name: { en: "Catering", ar: "تموين" } },
  { slug: "food-delivery", parentSlug: "food-beverage", iconId: "delivery", name: { en: "Food Delivery", ar: "توصيل طعام" } },
  
  // Sub-categories (Retail & Shopping)
  { slug: "supermarkets", parentSlug: "retail-shopping", iconId: "grocery", name: { en: "Supermarkets", ar: "سوبرماركت" } },
  { slug: "fashion-clothing", parentSlug: "retail-shopping", iconId: "fashion", name: { en: "Clothing & Fashion", ar: "ملابس وموضة" } },
  { slug: "electronics-stores", parentSlug: "retail-shopping", iconId: "electronics", name: { en: "Electronics Stores", ar: "محلات إلكترونيات" } },
  { slug: "mobile-shops", parentSlug: "retail-shopping", iconId: "phone", name: { en: "Mobile Phones", ar: "هواتف محمولة" } },
  { slug: "jewelry", parentSlug: "retail-shopping", iconId: "gift", name: { en: "Jewelry", ar: "مجوهرات" } },
  
  // Sub-categories (Health & Medical)
  { slug: "hospitals", parentSlug: "health-medical", iconId: "healthcare", name: { en: "Hospitals", ar: "مستشفيات" } },
  { slug: "clinics", parentSlug: "health-medical", iconId: "healthcare", name: { en: "Clinics", ar: "عيادات" } },
  { slug: "pharmacies", parentSlug: "health-medical", iconId: "pharmacy", name: { en: "Pharmacies", ar: "صيدليات" } },
  { slug: "dental", parentSlug: "health-medical", iconId: "healthcare", name: { en: "Dental", ar: "أسنان" } },
  
  // Sub-categories (Beauty & Wellness)
  { slug: "salons", parentSlug: "beauty-wellness", iconId: "beauty", name: { en: "Hair Salons", ar: "صالونات شعر" } },
  { slug: "barbers", parentSlug: "beauty-wellness", iconId: "beauty", name: { en: "Barbers", ar: "حلاقة رجالية" } },
  { slug: "spas", parentSlug: "beauty-wellness", iconId: "beauty", name: { en: "Spas", ar: "منتجعات صحية" } },
  { slug: "gym-fitness", parentSlug: "beauty-wellness", iconId: "fitness", name: { en: "Gyms & Fitness", ar: "نوادي ولياقة" } },
];

// ============================================================================
// SAMPLE BUSINESSES DATA
// ============================================================================
const SAMPLE_BUSINESSES = [
  {
    slug: "spirit-hub-cafe",
    username: "spirithub",
    name: { en: "Spirit Hub Cafe", ar: "سبيريت هب كافيه" },
    description: { en: "Premium specialty coffee and artisan pastries.", ar: "قهوة مميزة ومعجنات حرفية." },
    categorySlug: "cafes",
    city: "Muscat",
    address: "Al Khuwair, Muscat",
    phone: "+968 9876 5432",
    email: "info@spirithub.com",
    website: "https://spirithub.com",
    isApproved: true,
    isVerified: true,
    isSpecial: true,
    homepageFeatured: true,
    homepageTop: true,
    latitude: 23.5880,
    longitude: 58.3829,
  },
  {
    slug: "tech-solutions-oman",
    username: "techsolutions",
    name: { en: "Tech Solutions Oman", ar: "حلول التقنية عمان" },
    description: { en: "IT services, web development, and digital solutions.", ar: "خدمات تقنية المعلومات وتطوير المواقع والحلول الرقمية." },
    categorySlug: "technology-it",
    city: "Muscat",
    address: "Ruwi, Muscat",
    phone: "+968 2456 7890",
    email: "contact@techsolutions.om",
    website: "https://techsolutions.om",
    isApproved: true,
    isVerified: true,
    homepageFeatured: true,
  },
  {
    slug: "golden-jewels",
    username: "goldenjewels",
    name: { en: "Golden Jewels", ar: "المجوهرات الذهبية" },
    description: { en: "Fine gold and diamond jewelry.", ar: "مجوهرات ذهبية وألماس فاخرة." },
    categorySlug: "jewelry",
    city: "Muscat",
    address: "Mutrah Souq",
    phone: "+968 2411 2233",
    isApproved: true,
    homepageFeatured: true,
  },
  {
    slug: "healthy-bites",
    username: "healthybites",
    name: { en: "Healthy Bites", ar: "لقيمات صحية" },
    description: { en: "Organic and healthy food restaurant.", ar: "مطعم للطعام العضوي والصحي." },
    categorySlug: "restaurants",
    city: "Muscat",
    address: "Qurum, Muscat",
    phone: "+968 9123 4567",
    isApproved: true,
  },
  {
    slug: "fitness-zone",
    username: "fitnesszone",
    name: { en: "Fitness Zone Gym", ar: "نادي فتنس زون" },
    description: { en: "Modern gym with latest equipment.", ar: "نادي رياضي حديث بأحدث المعدات." },
    categorySlug: "gym-fitness",
    city: "Muscat",
    address: "Al Ghubra, Muscat",
    phone: "+968 2466 7788",
    isApproved: true,
  },
];

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

async function seedProducts(client) {
  console.log("\n📦 Seeding products...");
  let count = 0;
  const now = new Date();
  
  for (const p of PRODUCTS) {
    const id = nanoid();
    try {
      await client.query(`
        INSERT INTO products (id, slug, name_en, name_ar, description_en, description_ar, price, currency,
          program, plan, duration_days, features, badges, is_active, sort_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16)
        ON CONFLICT (slug) DO UPDATE SET
          name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar,
          description_en = EXCLUDED.description_en, description_ar = EXCLUDED.description_ar,
          price = EXCLUDED.price, currency = EXCLUDED.currency,
          features = EXCLUDED.features, badges = EXCLUDED.badges,
          sort_order = EXCLUDED.sort_order, updated_at = EXCLUDED.updated_at
      `, [
        id, p.slug, p.name.en, p.name.ar, p.description.en, p.description.ar,
        p.price, p.currency, p.program, p.plan, p.durationDays,
        JSON.stringify(p.features), JSON.stringify(p.badges), true, p.sortOrder, now
      ]);
      count++;
      console.log(`   ✓ ${p.slug}`);
    } catch (e) {
      console.error(`   ✗ ${p.slug}: ${e.message}`);
    }
  }
  
  console.log(`   Total: ${count} products seeded`);
  return count;
}

async function seedCategories(client) {
  console.log("\n📁 Seeding categories...");
  const categoryIds = new Map();
  let count = 0;
  const now = new Date();
  
  // First pass: insert without parent_id
  for (const c of CATEGORIES) {
    const id = nanoid();
    categoryIds.set(c.slug, id);
    try {
      await client.query(`
        INSERT INTO categories (id, slug, name_en, name_ar, icon_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $6)
        ON CONFLICT (slug) DO UPDATE SET
          name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar,
          icon_id = EXCLUDED.icon_id, updated_at = EXCLUDED.updated_at
        RETURNING id
      `, [id, c.slug, c.name.en, c.name.ar, c.iconId, now]);
      count++;
    } catch {
      // If conflict, get the existing id
      const existing = await client.query(`SELECT id FROM categories WHERE slug = $1`, [c.slug]);
      if (existing.rows[0]) categoryIds.set(c.slug, existing.rows[0].id);
    }
  }
  
  // Second pass: update parent_id
  for (const c of CATEGORIES) {
    if (c.parentSlug) {
      const parentId = categoryIds.get(c.parentSlug);
      const id = categoryIds.get(c.slug);
      if (parentId && id) {
        await client.query(`UPDATE categories SET parent_id = $1 WHERE id = $2`, [parentId, id]);
      }
    }
  }
  
  console.log(`   Total: ${count} categories seeded`);
  return categoryIds;
}

async function seedBusinesses(client, categoryIds) {
  console.log("\n🏢 Seeding sample businesses...");
  let count = 0;
  const now = new Date();
  
  for (const b of SAMPLE_BUSINESSES) {
    const id = nanoid();
    const categoryId = categoryIds.get(b.categorySlug);
    
    try {
      await client.query(`
        INSERT INTO businesses (id, slug, username, name_en, name_ar, description_en, description_ar,
          is_approved, is_verified, is_special, homepage_featured, homepage_top,
          category, category_id, city, address, phone, website, email,
          latitude, longitude, avatar_mode, media, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $24)
        ON CONFLICT (slug) DO UPDATE SET
          name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar,
          description_en = EXCLUDED.description_en, description_ar = EXCLUDED.description_ar,
          is_approved = EXCLUDED.is_approved, is_verified = EXCLUDED.is_verified,
          is_special = EXCLUDED.is_special, homepage_featured = EXCLUDED.homepage_featured,
          homepage_top = EXCLUDED.homepage_top, category_id = EXCLUDED.category_id,
          city = EXCLUDED.city, address = EXCLUDED.address, phone = EXCLUDED.phone,
          website = EXCLUDED.website, email = EXCLUDED.email,
          latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
          updated_at = EXCLUDED.updated_at
      `, [
        id, b.slug, b.username, b.name.en, b.name.ar,
        b.description?.en, b.description?.ar,
        b.isApproved || false, b.isVerified || false, b.isSpecial || false,
        b.homepageFeatured || false, b.homepageTop || false,
        b.categorySlug, categoryId, b.city, b.address, b.phone, b.website, b.email,
        b.latitude, b.longitude, 'icon', '{}', now
      ]);
      count++;
      console.log(`   ✓ ${b.slug}`);
    } catch (e) {
      console.error(`   ✗ ${b.slug}: ${e.message}`);
    }
  }
  
  console.log(`   Total: ${count} businesses seeded`);
  return count;
}

async function seedAdminUser(client) {
  console.log("\n👤 Checking admin user...");
  
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "change-me";
  
  // Check if admin exists
  const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [adminEmail]);
  if (existing.rows.length > 0) {
    console.log(`   ✓ Admin user already exists: ${adminEmail}`);
    return existing.rows[0].id;
  }
  
  // Create admin
  const id = nanoid();
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const now = new Date();
  
  await client.query(`
    INSERT INTO users (id, email, phone, full_name, password_hash, role, is_active, is_verified, is_phone_verified, approval_status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
  `, [id, adminEmail, '', 'Admin', passwordHash, 'admin', true, true, true, 'approved', now]);
  
  console.log(`   ✓ Created admin user: ${adminEmail}`);
  return id;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("=".repeat(60));
  console.log("PostgreSQL Database Seeder");
  console.log("=".repeat(60));
  console.log(`Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log("=".repeat(60));
  
  const client = await pool.connect();
  
  try {
    // Seed in order
    await seedAdminUser(client);
    const categoryIds = await seedCategories(client);
    await seedProducts(client);
    await seedBusinesses(client, categoryIds);
    
    // Show summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ Seeding complete!");
    console.log("=".repeat(60));
    
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM businesses) as businesses,
        (SELECT COUNT(*) FROM program_subscriptions) as subscriptions
    `);
    
    const s = stats.rows[0];
    console.log(`\n📊 Database stats:`);
    console.log(`   Users:         ${s.users}`);
    console.log(`   Categories:    ${s.categories}`);
    console.log(`   Products:      ${s.products}`);
    console.log(`   Businesses:    ${s.businesses}`);
    console.log(`   Subscriptions: ${s.subscriptions}`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("\n❌ Seeding failed:", err);
  process.exit(1);
});
