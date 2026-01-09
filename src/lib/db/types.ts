export type Locale = "en" | "ar";

export type Role = "admin" | "user";

export type LocalizedString = {
  en: string;
  ar: string;
};

export type Category = {
  id: string;
  slug: string;
  name: LocalizedString;
  createdAt: string;
  updatedAt: string;
};

export type Business = {
  id: string;
  slug: string;
  name: LocalizedString;
  description?: LocalizedString;
  /** Legacy free-text category (kept for backward-compat + search). Prefer categoryId. */
  category?: string;
  /** Reference to a managed Category (admin-defined, bilingual). */
  categoryId?: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  tags?: string[];
  media?: {
    cover?: string;
    logo?: string;
    banner?: string;
    gallery?: string[];
    videos?: string[];
  };
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
};
