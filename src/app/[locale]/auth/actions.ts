"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createUser, verifyUserPassword } from "@/lib/db/users";
import { getAuthCookieName, signAuthToken } from "@/lib/auth/jwt";
import type { Locale } from "@/lib/i18n/locales";

const loginSchema = z.object({
  locale: z.string(),
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

export async function loginAction(formData: FormData) {
  const raw = {
    locale: String(formData.get("locale") || "en"),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    next: String(formData.get("next") || "") || undefined,
  };

  const { locale, email, password, next } = loginSchema.parse(raw);
  const user = await verifyUserPassword({ email, password });
  if (!user) {
    redirect(`/${locale}/login?error=invalid`);
  }

  const token = await signAuthToken({ sub: user.id, email: user.email, role: user.role });
  const cookieName = getAuthCookieName();

  const secure = process.env.NODE_ENV === "production";
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
  });

  if (next && next.startsWith(`/${locale}/`)) {
    redirect(next);
  }

  redirect(`/${locale}/dashboard`);
}

const registerSchema = z.object({
  locale: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional(),
});

export async function registerAction(formData: FormData) {
  const raw = {
    locale: String(formData.get("locale") || "en"),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    next: String(formData.get("next") || "") || undefined,
  };

  const { locale, email, password, next } = registerSchema.parse(raw);

  let user;
  try {
    user = await createUser({ email, password, role: "user" });
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") {
      redirect(`/${locale}/register?error=taken`);
    }
    throw e;
  }

  const token = await signAuthToken({ sub: user.id, email: user.email, role: user.role });
  const cookieName = getAuthCookieName();

  const secure = process.env.NODE_ENV === "production";
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
  });

  if (next && next.startsWith(`/${locale}/`)) {
    redirect(next);
  }

  redirect(`/${locale}/dashboard`);
}

export async function logoutAction(locale: Locale) {
  const cookieName = getAuthCookieName();
  (await cookies()).set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  redirect(`/${locale}`);
}
