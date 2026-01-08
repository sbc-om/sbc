export type Locale = "en" | "ar";

export type Role = "admin" | "user";

export type LocalizedString = {
  en: string;
  ar: string;
};

export type Business = {
  id: string;
  slug: string;
  name: LocalizedString;
  description?: LocalizedString;
  category?: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  tags?: string[];
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
