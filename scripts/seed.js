import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { open } from "lmdb";

const SEED_CATEGORY_SPECS = [
  // Top-level groups
  {
    slug: "food-hospitality",
    name: { en: "Food & Hospitality", ar: "طعام وضيافة" },
    iconId: "restaurant",
  },
  {
    slug: "retail-shopping",
    name: { en: "Retail & Shopping", ar: "تجزئة وتسوق" },
    iconId: "shopping",
  },
  {
    slug: "health-wellbeing",
    name: { en: "Health & Wellbeing", ar: "صحة ورفاه" },
    iconId: "clinic",
  },
  {
    slug: "professional-services",
    name: { en: "Professional Services", ar: "خدمات مهنية" },
    iconId: "business",
  },
  {
    slug: "tech-media",
    name: { en: "Tech & Media", ar: "تقنية وإعلام" },
    iconId: "it",
  },
  {
    slug: "transport-travel",
    name: { en: "Transport & Travel", ar: "نقل وسفر" },
    iconId: "transport",
  },
  {
    slug: "home-construction",
    name: { en: "Home & Construction", ar: "منزل وإنشاءات" },
    iconId: "home",
  },
  {
    slug: "industry-agriculture",
    name: { en: "Industry & Agriculture", ar: "صناعة وزراعة" },
    iconId: "industry",
  },
  {
    slug: "community-public",
    name: { en: "Community & Public", ar: "مجتمع وقطاع عام" },
    iconId: "community",
  },

  // Food & hospitality
  {
    slug: "restaurant",
    parentSlug: "food-hospitality",
    name: { en: "Restaurant", ar: "مطعم" },
    iconId: "restaurant",
  },
  {
    slug: "cafe",
    parentSlug: "food-hospitality",
    name: { en: "Cafe", ar: "مقهى" },
    iconId: "cafe",
  },
  {
    slug: "fast-food",
    parentSlug: "food-hospitality",
    name: { en: "Fast Food", ar: "وجبات سريعة" },
    iconId: "fast-food",
  },
  {
    slug: "catering",
    parentSlug: "food-hospitality",
    name: { en: "Catering", ar: "تموين" },
    iconId: "catering",
  },
  {
    slug: "hotel",
    parentSlug: "food-hospitality",
    name: { en: "Hotel", ar: "فندق" },
    iconId: "hotel",
  },
  {
    slug: "delivery",
    parentSlug: "food-hospitality",
    name: { en: "Delivery", ar: "توصيل" },
    iconId: "delivery",
  },

  // Retail
  {
    slug: "grocery",
    parentSlug: "retail-shopping",
    name: { en: "Grocery", ar: "بقالة" },
    iconId: "grocery",
  },
  {
    slug: "supermarket",
    parentSlug: "retail-shopping",
    name: { en: "Supermarket", ar: "سوبرماركت" },
    iconId: "supermarket",
  },
  {
    slug: "fashion",
    parentSlug: "retail-shopping",
    name: { en: "Fashion", ar: "موضة" },
    iconId: "fashion",
  },
  {
    slug: "jewelry",
    parentSlug: "retail-shopping",
    name: { en: "Jewelry", ar: "مجوهرات" },
    iconId: "jewelry",
  },
  {
    slug: "electronics",
    parentSlug: "retail-shopping",
    name: { en: "Electronics", ar: "إلكترونيات" },
    iconId: "electronics",
  },
  {
    slug: "mobile",
    parentSlug: "retail-shopping",
    name: { en: "Mobile", ar: "هواتف" },
    iconId: "mobile",
  },
  {
    slug: "books",
    parentSlug: "retail-shopping",
    name: { en: "Books", ar: "كتب" },
    iconId: "books",
  },
  {
    slug: "printing",
    parentSlug: "retail-shopping",
    name: { en: "Printing", ar: "طباعة" },
    iconId: "printing",
  },

  // Health
  {
    slug: "pharmacy",
    parentSlug: "health-wellbeing",
    name: { en: "Pharmacy", ar: "صيدلية" },
    iconId: "pharmacy",
  },
  {
    slug: "clinic",
    parentSlug: "health-wellbeing",
    name: { en: "Clinic", ar: "عيادة" },
    iconId: "clinic",
  },
  {
    slug: "hospital",
    parentSlug: "health-wellbeing",
    name: { en: "Hospital", ar: "مستشفى" },
    iconId: "hospital",
  },
  {
    slug: "doctor",
    parentSlug: "health-wellbeing",
    name: { en: "Doctor", ar: "طبيب" },
    iconId: "doctor",
  },
  {
    slug: "fitness",
    parentSlug: "health-wellbeing",
    name: { en: "Fitness", ar: "لياقة" },
    iconId: "fitness",
  },
  {
    slug: "gym",
    parentSlug: "health-wellbeing",
    name: { en: "Gym", ar: "نادي رياضي" },
    iconId: "gym",
  },
  {
    slug: "beauty",
    parentSlug: "health-wellbeing",
    name: { en: "Beauty & Spa", ar: "تجميل وسبا" },
    iconId: "beauty",
  },
  {
    slug: "salon",
    parentSlug: "health-wellbeing",
    name: { en: "Salon", ar: "صالون" },
    iconId: "salon",
  },
  {
    slug: "barber",
    parentSlug: "health-wellbeing",
    name: { en: "Barber", ar: "حلاق" },
    iconId: "barber",
  },

  // Professional services
  {
    slug: "legal",
    parentSlug: "professional-services",
    name: { en: "Legal", ar: "قانوني" },
    iconId: "legal",
  },
  {
    slug: "accounting",
    parentSlug: "professional-services",
    name: { en: "Accounting", ar: "محاسبة" },
    iconId: "accounting",
  },
  {
    slug: "finance",
    parentSlug: "professional-services",
    name: { en: "Finance", ar: "مالية" },
    iconId: "finance",
  },
  {
    slug: "payments",
    parentSlug: "professional-services",
    name: { en: "Payments", ar: "مدفوعات" },
    iconId: "payments",
  },
  {
    slug: "marketing",
    parentSlug: "professional-services",
    name: { en: "Marketing", ar: "تسويق" },
    iconId: "marketing",
  },
  {
    slug: "customer-service",
    parentSlug: "professional-services",
    name: { en: "Customer Service", ar: "خدمة العملاء" },
    iconId: "customer-service",
  },

  // Tech & media
  {
    slug: "it",
    parentSlug: "tech-media",
    name: { en: "IT & Software", ar: "تقنية المعلومات" },
    iconId: "it",
  },
  {
    slug: "hosting",
    parentSlug: "tech-media",
    name: { en: "Hosting", ar: "استضافة" },
    iconId: "hosting",
  },
  {
    slug: "photo",
    parentSlug: "tech-media",
    name: { en: "Photography", ar: "تصوير" },
    iconId: "photo",
  },
  {
    slug: "video",
    parentSlug: "tech-media",
    name: { en: "Video", ar: "فيديو" },
    iconId: "video",
  },
  {
    slug: "art",
    parentSlug: "tech-media",
    name: { en: "Art & Design", ar: "فن وتصميم" },
    iconId: "art",
  },
  {
    slug: "ecommerce",
    parentSlug: "tech-media",
    name: { en: "E-commerce", ar: "تجارة إلكترونية" },
    iconId: "ecommerce",
  },

  // Transport
  {
    slug: "auto",
    parentSlug: "transport-travel",
    name: { en: "Automotive", ar: "سيارات" },
    iconId: "auto",
  },
  {
    slug: "car-repair",
    parentSlug: "transport-travel",
    name: { en: "Car Repair", ar: "تصليح سيارات" },
    iconId: "car-repair",
  },
  {
    slug: "travel",
    parentSlug: "transport-travel",
    name: { en: "Travel", ar: "سفر" },
    iconId: "travel",
  },
  {
    slug: "shipping",
    parentSlug: "transport-travel",
    name: { en: "Shipping", ar: "شحن" },
    iconId: "shipping",
  },

  // Home & construction
  {
    slug: "real-estate",
    parentSlug: "home-construction",
    name: { en: "Real Estate", ar: "عقارات" },
    iconId: "real-estate",
  },
  {
    slug: "construction",
    parentSlug: "home-construction",
    name: { en: "Construction", ar: "إنشاءات" },
    iconId: "construction",
  },
  {
    slug: "contracting",
    parentSlug: "home-construction",
    name: { en: "Contracting", ar: "مقاولات" },
    iconId: "contracting",
  },
  {
    slug: "plumbing",
    parentSlug: "home-construction",
    name: { en: "Plumbing", ar: "سباكة" },
    iconId: "plumbing",
  },
  {
    slug: "electrical",
    parentSlug: "home-construction",
    name: { en: "Electrical", ar: "كهرباء" },
    iconId: "electrical",
  },
  {
    slug: "cleaning",
    parentSlug: "home-construction",
    name: { en: "Cleaning", ar: "تنظيف" },
    iconId: "cleaning",
  },
  {
    slug: "laundry",
    parentSlug: "home-construction",
    name: { en: "Laundry", ar: "مغسلة" },
    iconId: "laundry",
  },
  {
    slug: "landscape",
    parentSlug: "home-construction",
    name: { en: "Landscaping", ar: "تنسيق حدائق" },
    iconId: "landscape",
  },

  // Industry & agriculture
  {
    slug: "warehouse",
    parentSlug: "industry-agriculture",
    name: { en: "Warehouse", ar: "مستودع" },
    iconId: "warehouse",
  },
  {
    slug: "tools",
    parentSlug: "industry-agriculture",
    name: { en: "Tools & Repairs", ar: "أدوات وصيانة" },
    iconId: "tools",
  },
  {
    slug: "agriculture",
    parentSlug: "industry-agriculture",
    name: { en: "Agriculture", ar: "زراعة" },
    iconId: "agriculture",
  },
  {
    slug: "plants",
    parentSlug: "industry-agriculture",
    name: { en: "Plants", ar: "نباتات" },
    iconId: "plants",
  },
  {
    slug: "nature",
    parentSlug: "industry-agriculture",
    name: { en: "Nature", ar: "طبيعة" },
    iconId: "nature",
  },

  // Community & public
  {
    slug: "government",
    parentSlug: "community-public",
    name: { en: "Government", ar: "حكومي" },
    iconId: "government",
  },
  {
    slug: "nonprofit",
    parentSlug: "community-public",
    name: { en: "Nonprofit", ar: "غير ربحي" },
    iconId: "nonprofit",
  },
  {
    slug: "events",
    parentSlug: "community-public",
    name: { en: "Events", ar: "فعاليات" },
    iconId: "events",
  },
  {
    slug: "sports",
    parentSlug: "community-public",
    name: { en: "Sports", ar: "رياضة" },
    iconId: "sports",
  },
  {
    slug: "entertainment",
    parentSlug: "community-public",
    name: { en: "Entertainment", ar: "ترفيه" },
    iconId: "entertainment",
  },
  {
    slug: "security",
    parentSlug: "community-public",
    name: { en: "Security", ar: "أمن" },
    iconId: "security",
  },
  {
    slug: "pets",
    parentSlug: "community-public",
    name: { en: "Pets", ar: "حيوانات أليفة" },
    iconId: "pets",
  },
  {
    slug: "kids",
    parentSlug: "community-public",
    name: { en: "Kids", ar: "أطفال" },
    iconId: "kids",
  },
];

const SEED_BUSINESS_SPECS = [
  {
    slug: "muscat-bean-roasters",
    name: { en: "Muscat Bean Roasters", ar: "محمصة مسقط" },
    description: {
      en: "Specialty coffee, pastries, and comfortable seating.",
      ar: "قهوة مختصة، معجنات، وجلسات مريحة.",
    },
    categorySlug: "cafe",
    city: "Muscat",
    tags: ["coffee", "wifi", "pastry"],
    avatarMode: "icon",
  },
  {
    slug: "sahar-seaside-kitchen",
    name: { en: "Sahar Seaside Kitchen", ar: "مطبخ سحر الساحلي" },
    description: {
      en: "Seafood and grills with family-friendly atmosphere.",
      ar: "مأكولات بحرية ومشاوي بأجواء مناسبة للعائلات.",
    },
    categorySlug: "restaurant",
    city: "Muscat",
    tags: ["seafood", "grill", "family"],
    avatarMode: "icon",
  },
  {
    slug: "al-batinah-pharmacy",
    name: { en: "Al Batinah Pharmacy", ar: "صيدلية الباطنة" },
    description: {
      en: "Daily essentials, wellness products, and quick service.",
      ar: "مستلزمات يومية، منتجات عناية، وخدمة سريعة.",
    },
    categorySlug: "pharmacy",
    city: "Muscat",
    tags: ["pharmacy", "health"],
    avatarMode: "icon",
  },
  {
    slug: "city-fit-club",
    name: { en: "City Fit Club", ar: "نادي سيتي فيت" },
    description: {
      en: "Modern gym with classes and personal training.",
      ar: "نادي رياضي حديث مع حصص وتدريب شخصي.",
    },
    categorySlug: "gym",
    city: "Muscat",
    tags: ["gym", "fitness", "classes"],
    avatarMode: "logo",
    logo: "/images/seed-logos/city-fit.svg",
  },
  {
    slug: "oasis-legal-consulting",
    name: { en: "Oasis Legal Consulting", ar: "واحة للاستشارات القانونية" },
    description: {
      en: "Business legal services, contracts, and consultations.",
      ar: "خدمات قانونية للأعمال، عقود، واستشارات.",
    },
    categorySlug: "legal",
    city: "Muscat",
    tags: ["legal", "contracts", "consulting"],
    avatarMode: "logo",
    logo: "/images/seed-logos/oasis-legal.svg",
  },
  {
    slug: "pearl-salon-spa",
    name: { en: "Pearl Salon & Spa", ar: "صالون وسبا اللؤلؤة" },
    description: {
      en: "Hair, nails, and spa services with appointments.",
      ar: "خدمات شعر وأظافر وسبا مع حجوزات.",
    },
    categorySlug: "salon",
    city: "Muscat",
    tags: ["salon", "spa", "beauty"],
    avatarMode: "icon",
  },
  {
    slug: "swift-car-care",
    name: { en: "Swift Car Care", ar: "سويفت لخدمة السيارات" },
    description: {
      en: "Quick diagnostics, maintenance, and repairs.",
      ar: "فحص سريع، صيانة، وإصلاحات.",
    },
    categorySlug: "car-repair",
    city: "Muscat",
    tags: ["car", "repair", "maintenance"],
    avatarMode: "icon",
  },
  {
    slug: "souq-smart-electronics",
    name: { en: "Souq Smart Electronics", ar: "سوق سمارت للإلكترونيات" },
    description: {
      en: "Electronics, accessories, and after-sales support.",
      ar: "إلكترونيات، إكسسوارات، ودعم ما بعد البيع.",
    },
    categorySlug: "electronics",
    city: "Muscat",
    tags: ["electronics", "accessories"],
    avatarMode: "logo",
    logo: "/images/seed-logos/souq-smart.svg",
  },
  {
    slug: "printcraft-studio",
    name: { en: "PrintCraft Studio", ar: "ستوديو برنتكرافت" },
    description: {
      en: "Business cards, flyers, signage, and design support.",
      ar: "بطاقات عمل، منشورات، لافتات، ودعم تصميم.",
    },
    categorySlug: "printing",
    city: "Muscat",
    tags: ["printing", "design"],
    avatarMode: "icon",
  },
  {
    slug: "greenleaf-landscapes",
    name: { en: "GreenLeaf Landscapes", ar: "جرين ليف لتنسيق الحدائق" },
    description: {
      en: "Garden design, irrigation planning, and maintenance.",
      ar: "تصميم حدائق، تخطيط ري، وصيانة.",
    },
    categorySlug: "landscape",
    city: "Muscat",
    tags: ["landscape", "garden", "maintenance"],
    avatarMode: "icon",
  },
  {
    slug: "dunes-boutique-hotel",
    name: { en: "Dunes Boutique Hotel", ar: "فندق ديونز بوتيك" },
    description: {
      en: "Boutique stay with breakfast and airport pickup.",
      ar: "إقامة بوتيك مع إفطار وتوصيل من وإلى المطار.",
    },
    categorySlug: "hotel",
    city: "Muscat",
    tags: ["hotel", "stay", "travel"],
    avatarMode: "icon",
  },
];

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
  const categories = root.openDB({ name: "categories" });
  const categorySlugs = root.openDB({ name: "categorySlugs" });
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

    await users.put(admin.id, admin);
    await userEmails.put(adminEmail, admin.id);
    console.log(`Created admin: ${adminEmail}`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  const now = new Date().toISOString();

  function isTestCategoryLike(c) {
    const slug = String(c?.slug || "").toLowerCase();
    const en = String(c?.name?.en || "").toLowerCase();
    const ar = String(c?.name?.ar || "");
    return (
      slug === "test" ||
      slug === "test-category" ||
      slug.startsWith("test-") ||
      en === "test category" ||
      en.startsWith("test ") ||
      ar.includes("تست")
    );
  }

  function isTestBusinessLike(b) {
    const slug = String(b?.slug || "").toLowerCase();
    const en = String(b?.name?.en || "").toLowerCase();
    const ar = String(b?.name?.ar || "");
    return (
      slug === "test" ||
      slug === "test-business" ||
      slug.startsWith("test-") ||
      en === "test business" ||
      en.startsWith("test ") ||
      ar.includes("تست")
    );
  }

  async function upsertCategoryBySlug(spec) {
    const existingId = categorySlugs.get(spec.slug);
    if (existingId) {
      const current = categories.get(existingId);
      await categories.put(existingId, {
        ...current,
        slug: spec.slug,
        name: spec.name,
        iconId: spec.iconId,
        parentId: spec.parentId,
        createdAt: current?.createdAt || now,
        updatedAt: now,
      });
      return existingId;
    }

    const id = nanoid();
    await categories.put(id, {
      id,
      slug: spec.slug,
      name: spec.name,
      iconId: spec.iconId,
      parentId: spec.parentId,
      createdAt: now,
      updatedAt: now,
    });
    await categorySlugs.put(spec.slug, id);
    return id;
  }

  async function deleteBusinessById(id) {
    const current = businesses.get(id);
    if (!current) return;
    await businesses.remove(id);
    await businessSlugs.remove(current.slug);
  }

  async function deleteCategoryById(id) {
    const current = categories.get(id);
    if (!current) return;
    await categories.remove(id);
    await categorySlugs.remove(current.slug);
  }

  // 1) Remove obvious test businesses (safe heuristic)
  for (const { key, value } of businesses.getRange()) {
    if (!isTestBusinessLike(value)) continue;
    await deleteBusinessById(key);
  }

  // 2) Remove obvious test categories (only if unused by businesses)
  const usedCategoryIds = new Set();
  for (const { value } of businesses.getRange()) {
    if (value?.categoryId) usedCategoryIds.add(value.categoryId);
  }
  for (const { key, value } of categories.getRange()) {
    if (!isTestCategoryLike(value)) continue;
    if (usedCategoryIds.has(key)) continue;
    await deleteCategoryById(key);
  }

  // 3) Upsert categories (two-phase so parentId resolves reliably)
  for (const spec of SEED_CATEGORY_SPECS) {
    await upsertCategoryBySlug({ ...spec, parentId: undefined });
  }

  for (const spec of SEED_CATEGORY_SPECS) {
    if (!spec.parentSlug) continue;
    const id = categorySlugs.get(spec.slug);
    const parentId = categorySlugs.get(spec.parentSlug);
    if (!id || !parentId) continue;
    const current = categories.get(id);
    await categories.put(id, {
      ...current,
      parentId,
      updatedAt: now,
    });
  }

  // 4) Remove older sample businesses from previous seed script (only these slugs)
  const legacySeedSlugs = ["al-noor-cafe", "sbc-legal"];
  for (const slug of legacySeedSlugs) {
    const id = businessSlugs.get(slug);
    if (id) await deleteBusinessById(id);
  }

  // 5) Upsert sample businesses linked by categoryId
  for (const spec of SEED_BUSINESS_SPECS) {
    const categoryId = categorySlugs.get(spec.categorySlug);
    if (!categoryId) throw new Error(`Missing category for business: ${spec.slug} -> ${spec.categorySlug}`);

    const existingId = businessSlugs.get(spec.slug);
    const base = {
      slug: spec.slug,
      name: spec.name,
      description: spec.description,
      categoryId,
      category: spec.categorySlug,
      city: spec.city,
      tags: spec.tags,
      avatarMode: spec.avatarMode || "icon",
      media: spec.logo ? { logo: spec.logo } : undefined,
      updatedAt: now,
    };

    if (existingId) {
      const current = businesses.get(existingId);
      await businesses.put(existingId, {
        ...current,
        ...base,
        createdAt: current?.createdAt || now,
      });
      continue;
    }

    const id = nanoid();
    await businesses.put(id, {
      id,
      ...base,
      createdAt: now,
    });
    await businessSlugs.put(spec.slug, id);
  }

  console.log(`Seeded categories: ${SEED_CATEGORY_SPECS.length}`);
  console.log(`Seeded businesses: ${SEED_BUSINESS_SPECS.length}`);

  root.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
