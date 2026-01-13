import type { ComponentType } from "react";
import {
  FiActivity,
  FiAirplay,
  FiAperture,
  FiArchive,
  FiAward,
  FiBarChart2,
  FiBatteryCharging,
  FiBell,
  FiBook,
  FiBriefcase,
  FiCamera,
  FiCast,
  FiCoffee,
  FiCommand,
  FiCpu,
  FiCreditCard,
  FiDroplet,
  FiEdit3,
  FiFeather,
  FiFilm,
  FiFlag,
  FiGift,
  FiGlobe,
  FiGrid,
  FiHardDrive,
  FiHeadphones,
  FiHeart,
  FiHome,
  FiImage,
  FiKey,
  FiLayers,
  FiMapPin,
  FiMonitor,
  FiMusic,
  FiPackage,
  FiPenTool,
  FiPhone,
  FiPieChart,
  FiScissors,
  FiShield,
  FiShoppingBag,
  FiShoppingCart,
  FiSmile,
  FiStar,
  FiTruck,
  FiUmbrella,
  FiUsers,
  FiVideo,
  FiZap,
} from "react-icons/fi";

import type { Locale } from "@/lib/db/types";

export type CategoryIconOption = {
  id: string;
  Icon: ComponentType<{ className?: string }>;
  labelEn: string;
  labelAr: string;
};

/**
 * Stored in DB as Category.iconId.
 * Keep IDs stable once released.
 */
export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { id: "generic", Icon: FiGrid, labelEn: "General", labelAr: "عام" },

  // Food & hospitality
  { id: "restaurant", Icon: FiCoffee, labelEn: "Restaurant", labelAr: "مطعم" },
  { id: "cafe", Icon: FiCoffee, labelEn: "Cafe", labelAr: "مقهى" },
  { id: "hotel", Icon: FiHome, labelEn: "Hotel", labelAr: "فندق" },
  { id: "delivery", Icon: FiTruck, labelEn: "Delivery", labelAr: "توصيل" },

  // Retail
  { id: "shopping", Icon: FiShoppingBag, labelEn: "Shopping", labelAr: "تسوق" },
  { id: "grocery", Icon: FiShoppingCart, labelEn: "Grocery", labelAr: "بقالة" },
  { id: "pharmacy", Icon: FiHeart, labelEn: "Pharmacy", labelAr: "صيدلية" },
  { id: "fashion", Icon: FiScissors, labelEn: "Fashion", labelAr: "موضة" },
  { id: "electronics", Icon: FiCpu, labelEn: "Electronics", labelAr: "إلكترونيات" },
  { id: "furniture", Icon: FiHome, labelEn: "Furniture", labelAr: "أثاث" },
  { id: "gift", Icon: FiGift, labelEn: "Gifts", labelAr: "هدايا" },

  // Services
  { id: "professional", Icon: FiBriefcase, labelEn: "Professional services", labelAr: "خدمات مهنية" },
  { id: "legal", Icon: FiShield, labelEn: "Legal", labelAr: "قانوني" },
  { id: "finance", Icon: FiCreditCard, labelEn: "Finance", labelAr: "مالية" },
  { id: "education", Icon: FiBook, labelEn: "Education", labelAr: "تعليم" },
  { id: "healthcare", Icon: FiActivity, labelEn: "Healthcare", labelAr: "رعاية صحية" },
  { id: "beauty", Icon: FiSmile, labelEn: "Beauty", labelAr: "تجميل" },
  { id: "fitness", Icon: FiZap, labelEn: "Fitness", labelAr: "لياقة" },
  { id: "repair", Icon: FiToolFallback(), labelEn: "Repairs", labelAr: "صيانة" },

  // Tech & media
  { id: "it", Icon: FiMonitor, labelEn: "IT & Software", labelAr: "تقنية المعلومات" },
  { id: "marketing", Icon: FiBarChart2, labelEn: "Marketing", labelAr: "تسويق" },
  { id: "photo", Icon: FiCamera, labelEn: "Photography", labelAr: "تصوير" },
  { id: "video", Icon: FiVideo, labelEn: "Video", labelAr: "فيديو" },
  { id: "music", Icon: FiMusic, labelEn: "Music", labelAr: "موسيقى" },

  // Travel & transport
  { id: "travel", Icon: FiGlobe, labelEn: "Travel", labelAr: "سفر" },
  { id: "transport", Icon: FiTruck, labelEn: "Transport", labelAr: "نقل" },
  { id: "auto", Icon: FiTruck, labelEn: "Automotive", labelAr: "سيارات" },
  { id: "location", Icon: FiMapPin, labelEn: "Location", labelAr: "موقع" },

  // Home & construction
  { id: "home-services", Icon: FiHome, labelEn: "Home services", labelAr: "خدمات منزلية" },
  { id: "construction", Icon: FiLayers, labelEn: "Construction", labelAr: "إنشاءات" },
  { id: "real-estate", Icon: FiHome, labelEn: "Real estate", labelAr: "عقارات" },

  // Industry
  { id: "manufacturing", Icon: FiPackage, labelEn: "Manufacturing", labelAr: "تصنيع" },
  { id: "logistics", Icon: FiTruck, labelEn: "Logistics", labelAr: "لوجستيات" },
  { id: "energy", Icon: FiBatteryCharging, labelEn: "Energy", labelAr: "طاقة" },
  { id: "agriculture", Icon: FiDroplet, labelEn: "Agriculture", labelAr: "زراعة" },

  // Community
  { id: "events", Icon: FiStar, labelEn: "Events", labelAr: "فعاليات" },
  { id: "nonprofit", Icon: FiUsers, labelEn: "Nonprofit", labelAr: "غير ربحي" },
  { id: "religion", Icon: FiFlag, labelEn: "Community", labelAr: "مجتمع" },

  // Misc
  { id: "media", Icon: FiCast, labelEn: "Media", labelAr: "إعلام" },
  { id: "art", Icon: FiAperture, labelEn: "Art & Design", labelAr: "فن وتصميم" },
  { id: "security", Icon: FiShield, labelEn: "Security", labelAr: "أمن" },
  { id: "kids", Icon: FiSmile, labelEn: "Kids", labelAr: "أطفال" },
  { id: "pets", Icon: FiHeart, labelEn: "Pets", labelAr: "حيوانات أليفة" },
  { id: "printing", Icon: FiEdit3, labelEn: "Printing", labelAr: "طباعة" },
  { id: "hardware", Icon: FiHardDrive, labelEn: "Hardware", labelAr: "أجهزة" },
  { id: "books", Icon: FiBook, labelEn: "Books", labelAr: "كتب" },
  { id: "audio", Icon: FiHeadphones, labelEn: "Audio", labelAr: "صوت" },
  { id: "content", Icon: FiFilm, labelEn: "Content", labelAr: "محتوى" },
  { id: "archive", Icon: FiArchive, labelEn: "Storage", labelAr: "تخزين" },
  { id: "award", Icon: FiAward, labelEn: "Awards", labelAr: "جوائز" },
  { id: "umbrella", Icon: FiUmbrella, labelEn: "Insurance", labelAr: "تأمين" },
  { id: "key", Icon: FiKey, labelEn: "Keys", labelAr: "مفاتيح" },
  { id: "creative", Icon: FiPenTool, labelEn: "Creative", labelAr: "إبداع" },
  { id: "broadcast", Icon: FiAirplay, labelEn: "Broadcast", labelAr: "بث" },
  { id: "notifications", Icon: FiBell, labelEn: "Notifications", labelAr: "تنبيهات" },
  { id: "command", Icon: FiCommand, labelEn: "Tools", labelAr: "أدوات" },
  { id: "phone", Icon: FiPhone, labelEn: "Phone", labelAr: "هاتف" },
  { id: "stats", Icon: FiPieChart, labelEn: "Analytics", labelAr: "تحليلات" },
  { id: "feather", Icon: FiFeather, labelEn: "Writing", labelAr: "كتابة" },
  { id: "image", Icon: FiImage, labelEn: "Images", labelAr: "صور" },
];

export const DEFAULT_CATEGORY_ICON = "generic" as const;

const byId = new Map(CATEGORY_ICON_OPTIONS.map((x) => [x.id, x] as const));

export function isValidCategoryIconId(iconId: string): boolean {
  return byId.has(iconId);
}

export function getCategoryIconOption(iconId: string | null | undefined): CategoryIconOption {
  const id = (iconId ?? "").trim();
  return byId.get(id) ?? byId.get(DEFAULT_CATEGORY_ICON)!;
}

export function getCategoryIconComponent(iconId: string | null | undefined): CategoryIconOption["Icon"] {
  return getCategoryIconOption(iconId).Icon;
}

export function getCategoryIconLabel(iconId: string | null | undefined, locale: Locale): string {
  const opt = getCategoryIconOption(iconId);
  return locale === "ar" ? opt.labelAr : opt.labelEn;
}

/**
 * react-icons doesn't include a dedicated "tools" icon in Feather set.
 * This tiny helper keeps the options list readable.
 */
function FiToolFallback(): ComponentType<{ className?: string }> {
  return FiCommand;
}
