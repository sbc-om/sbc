import { createElement, type ComponentType } from "react";
import {
  FaBriefcase,
  FaUtensils,
  FaCoffee,
  FaShoppingCart,
  FaClinicMedical,
  FaHospital,
  FaStethoscope,
  FaDumbbell,
  FaSpa,
  FaCut,
  FaCar,
  FaHammer,
  FaHardHat,
  FaHome,
  FaBalanceScale,
  FaCalculator,
  FaMoneyBillWave,
  FaCreditCard,
  FaChalkboardTeacher,
  FaBook,
  FaSchool,
  FaLaptopCode,
  FaMobileAlt,
  FaServer,
  FaBroadcastTower,
  FaVideo,
  FaMusic,
  FaSeedling,
  FaTractor,
  FaIndustry,
  FaWarehouse,
  FaTruck,
  FaPlane,
  FaShip,
  FaMapMarkedAlt,
  FaUsers,
  FaHandsHelping,
  FaTheaterMasks,
  FaBasketballBall,
  FaBaby,
  FaTshirt,
  FaGem,
  FaStore,
  FaPrint,
} from "react-icons/fa";
import {
  MdLocalPharmacy,
  MdRestaurant,
  MdLocalGroceryStore,
  MdFitnessCenter,
  MdLocalLaundryService,
  MdPlumbing,
  MdElectricalServices,
  MdCarRepair,
  MdStoreMallDirectory,
  MdOutlineSecurity,
  MdOutlineEvent,
  MdOutlineEmojiNature,
  MdOutlineCleaningServices,
  MdOutlinePets,
} from "react-icons/md";
import {
  RiHotelLine,
  RiBuilding2Line,
  RiCustomerService2Line,
  RiBankLine,
  RiGovernmentLine,
  RiShoppingBag3Line,
  RiRestaurant2Line,
  RiScissors2Line,
  RiShieldKeyholeLine,
  RiToolsLine,
  RiComputerLine,
  RiCameraLensLine,
  RiMovie2Line,
  RiPaletteLine,
  RiShareBoxLine,
  RiLandscapeLine,
} from "react-icons/ri";

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
  // Default / generic
  { id: "generic", Icon: MdStoreMallDirectory, labelEn: "General", labelAr: "عام" },
  { id: "business", Icon: FaBriefcase, labelEn: "Business", labelAr: "أعمال" },
  { id: "store", Icon: FaStore, labelEn: "Store", labelAr: "متجر" },

  // Food & hospitality
  { id: "restaurant", Icon: MdRestaurant, labelEn: "Restaurant", labelAr: "مطعم" },
  { id: "cafe", Icon: FaCoffee, labelEn: "Cafe", labelAr: "مقهى" },
  { id: "fast-food", Icon: RiRestaurant2Line, labelEn: "Fast food", labelAr: "وجبات سريعة" },
  { id: "hotel", Icon: RiHotelLine, labelEn: "Hotel", labelAr: "فندق" },
  { id: "catering", Icon: FaUtensils, labelEn: "Catering", labelAr: "تموين" },
  { id: "delivery", Icon: FaTruck, labelEn: "Delivery", labelAr: "توصيل" },

  // Retail
  { id: "shopping", Icon: RiShoppingBag3Line, labelEn: "Shopping", labelAr: "تسوق" },
  { id: "grocery", Icon: MdLocalGroceryStore, labelEn: "Grocery", labelAr: "بقالة" },
  { id: "supermarket", Icon: FaShoppingCart, labelEn: "Supermarket", labelAr: "سوبرماركت" },
  { id: "fashion", Icon: FaTshirt, labelEn: "Fashion", labelAr: "موضة" },
  { id: "jewelry", Icon: FaGem, labelEn: "Jewelry", labelAr: "مجوهرات" },
  { id: "electronics", Icon: RiComputerLine, labelEn: "Electronics", labelAr: "إلكترونيات" },
  { id: "mobile", Icon: FaMobileAlt, labelEn: "Mobile", labelAr: "هواتف" },
  { id: "books", Icon: FaBook, labelEn: "Books", labelAr: "كتب" },
  { id: "printing", Icon: FaPrint, labelEn: "Printing", labelAr: "طباعة" },

  // Health & wellbeing
  { id: "pharmacy", Icon: MdLocalPharmacy, labelEn: "Pharmacy", labelAr: "صيدلية" },
  { id: "clinic", Icon: FaClinicMedical, labelEn: "Clinic", labelAr: "عيادة" },
  { id: "hospital", Icon: FaHospital, labelEn: "Hospital", labelAr: "مستشفى" },
  { id: "doctor", Icon: FaStethoscope, labelEn: "Doctor", labelAr: "طبيب" },
  { id: "fitness", Icon: MdFitnessCenter, labelEn: "Fitness", labelAr: "لياقة" },
  { id: "gym", Icon: FaDumbbell, labelEn: "Gym", labelAr: "نادي رياضي" },
  { id: "beauty", Icon: FaSpa, labelEn: "Beauty & Spa", labelAr: "تجميل وسبا" },
  { id: "salon", Icon: RiScissors2Line, labelEn: "Salon", labelAr: "صالون" },
  { id: "barber", Icon: FaCut, labelEn: "Barber", labelAr: "حلاق" },

  // Professional services
  { id: "legal", Icon: FaBalanceScale, labelEn: "Legal", labelAr: "قانوني" },
  { id: "accounting", Icon: FaCalculator, labelEn: "Accounting", labelAr: "محاسبة" },
  { id: "finance", Icon: FaMoneyBillWave, labelEn: "Finance", labelAr: "مالية" },
  { id: "bank", Icon: RiBankLine, labelEn: "Bank", labelAr: "بنك" },
  { id: "payments", Icon: FaCreditCard, labelEn: "Payments", labelAr: "مدفوعات" },
  { id: "customer-service", Icon: RiCustomerService2Line, labelEn: "Customer service", labelAr: "خدمة العملاء" },

  // Education
  { id: "education", Icon: FaChalkboardTeacher, labelEn: "Education", labelAr: "تعليم" },
  { id: "school", Icon: FaSchool, labelEn: "School", labelAr: "مدرسة" },
  { id: "training", Icon: FaBook, labelEn: "Training", labelAr: "تدريب" },

  // Tech & media
  { id: "it", Icon: FaLaptopCode, labelEn: "IT & Software", labelAr: "تقنية المعلومات" },
  { id: "hosting", Icon: FaServer, labelEn: "Hosting", labelAr: "استضافة" },
  { id: "marketing", Icon: FaBroadcastTower, labelEn: "Marketing", labelAr: "تسويق" },
  { id: "photo", Icon: RiCameraLensLine, labelEn: "Photography", labelAr: "تصوير" },
  { id: "video", Icon: FaVideo, labelEn: "Video", labelAr: "فيديو" },
  { id: "cinema", Icon: RiMovie2Line, labelEn: "Cinema", labelAr: "سينما" },
  { id: "music", Icon: FaMusic, labelEn: "Music", labelAr: "موسيقى" },
  { id: "art", Icon: RiPaletteLine, labelEn: "Art & Design", labelAr: "فن وتصميم" },
  { id: "ecommerce", Icon: RiShareBoxLine, labelEn: "E-commerce", labelAr: "تجارة إلكترونية" },

  // Transport & travel
  { id: "auto", Icon: FaCar, labelEn: "Automotive", labelAr: "سيارات" },
  { id: "car-repair", Icon: MdCarRepair, labelEn: "Car repair", labelAr: "تصليح سيارات" },
  { id: "transport", Icon: FaTruck, labelEn: "Transport", labelAr: "نقل" },
  { id: "travel", Icon: FaPlane, labelEn: "Travel", labelAr: "سفر" },
  { id: "shipping", Icon: FaShip, labelEn: "Shipping", labelAr: "شحن" },
  { id: "location", Icon: FaMapMarkedAlt, labelEn: "Location", labelAr: "موقع" },

  // Home & construction
  { id: "home", Icon: FaHome, labelEn: "Home", labelAr: "منزل" },
  { id: "real-estate", Icon: RiBuilding2Line, labelEn: "Real estate", labelAr: "عقارات" },
  { id: "construction", Icon: FaHardHat, labelEn: "Construction", labelAr: "إنشاءات" },
  { id: "contracting", Icon: FaHammer, labelEn: "Contracting", labelAr: "مقاولات" },
  { id: "plumbing", Icon: MdPlumbing, labelEn: "Plumbing", labelAr: "سباكة" },
  { id: "electrical", Icon: MdElectricalServices, labelEn: "Electrical", labelAr: "كهرباء" },
  { id: "cleaning", Icon: MdOutlineCleaningServices, labelEn: "Cleaning", labelAr: "تنظيف" },
  { id: "laundry", Icon: MdLocalLaundryService, labelEn: "Laundry", labelAr: "مغسلة" },

  // Industry & agriculture
  { id: "industry", Icon: FaIndustry, labelEn: "Industry", labelAr: "صناعة" },
  { id: "warehouse", Icon: FaWarehouse, labelEn: "Warehouse", labelAr: "مستودع" },
  { id: "tools", Icon: RiToolsLine, labelEn: "Tools & repairs", labelAr: "أدوات وصيانة" },
  { id: "agriculture", Icon: FaTractor, labelEn: "Agriculture", labelAr: "زراعة" },
  { id: "plants", Icon: FaSeedling, labelEn: "Plants", labelAr: "نباتات" },
  { id: "nature", Icon: MdOutlineEmojiNature, labelEn: "Nature", labelAr: "طبيعة" },
  { id: "landscape", Icon: RiLandscapeLine, labelEn: "Landscaping", labelAr: "تنسيق حدائق" },

  // Public & community
  { id: "government", Icon: RiGovernmentLine, labelEn: "Government", labelAr: "حكومي" },
  { id: "community", Icon: FaUsers, labelEn: "Community", labelAr: "مجتمع" },
  { id: "nonprofit", Icon: FaHandsHelping, labelEn: "Nonprofit", labelAr: "غير ربحي" },
  { id: "events", Icon: MdOutlineEvent, labelEn: "Events", labelAr: "فعاليات" },
  { id: "sports", Icon: FaBasketballBall, labelEn: "Sports", labelAr: "رياضة" },
  { id: "entertainment", Icon: FaTheaterMasks, labelEn: "Entertainment", labelAr: "ترفيه" },

  // Safety & misc
  { id: "security", Icon: MdOutlineSecurity, labelEn: "Security", labelAr: "أمن" },
  { id: "access", Icon: RiShieldKeyholeLine, labelEn: "Access & keys", labelAr: "مفاتيح وأقفال" },
  { id: "pets", Icon: MdOutlinePets, labelEn: "Pets", labelAr: "حيوانات أليفة" },
  { id: "kids", Icon: FaBaby, labelEn: "Kids", labelAr: "أطفال" },
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

export function renderCategoryIcon(iconId: string | null | undefined, className?: string) {
  const Icon = getCategoryIconComponent(iconId);
  return createElement(Icon, { className });
}

export function getCategoryIconLabel(iconId: string | null | undefined, locale: Locale): string {
  const opt = getCategoryIconOption(iconId);
  return locale === "ar" ? opt.labelAr : opt.labelEn;
}
