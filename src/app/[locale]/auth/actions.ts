"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createUser, verifyUserPassword, getUserById } from "@/lib/db/users";
import { getAuthCookieName, signAuthToken } from "@/lib/auth/jwt";
import { verifyHumanChallenge } from "@/lib/auth/humanChallenge";
import { isWAHAEnabled, sendLoginNotification } from "@/lib/waha/client";
import type { Locale } from "@/lib/i18n/locales";

const loginSchema = z.object({
  locale: z.string(),
  identifier: z.string().min(1),
  password: z.string().min(1),
  humanToken: z.string(),
  humanAnswer: z.string(),
  next: z.string().optional(),
});

export async function loginAction(formData: FormData) {
  const raw = {
    locale: String(formData.get("locale") || "en"),
    identifier: String(formData.get("identifier") || ""),
    password: String(formData.get("password") || ""),
    humanToken: String(formData.get("humanToken") || ""),
    humanAnswer: String(formData.get("humanAnswer") || ""),
    next: String(formData.get("next") || "") || undefined,
  };

  const { locale, identifier, password, humanToken, humanAnswer, next } =
    loginSchema.parse(raw);
  if (!verifyHumanChallenge(humanToken, humanAnswer)) {
    redirect(`/${locale}/login?error=human`);
  }
  const user = await verifyUserPassword({ identifier, password });
  if (!user) {
    redirect(`/${locale}/login?error=invalid`);
  }
  if (user.approvalStatus && user.approvalStatus !== "approved") {
    redirect(`/${locale}/login?error=approval`);
  }
  if (user.isActive === false) {
    redirect(`/${locale}/login?error=inactive`);
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

  // Send login notification
  if (user.phone && isWAHAEnabled()) {
    sendLoginNotification(user.phone, locale as "en" | "ar", "password").catch(console.error);
  }

  // Check if phone verification is required and user is not verified
  const wahaEnabled = isWAHAEnabled();
  if (wahaEnabled && !user.isPhoneVerified) {
    redirect(`/${locale}/verify-phone`);
  }

  if (next && next.startsWith(`/${locale}/`)) {
    redirect(next);
  }

  redirect(`/${locale}/dashboard`);
}

const registerSchema = z.object({
  locale: z.string(),
  email: z.string().email(),
  phone: z.string().min(6),
  fullName: z.string().min(2),
  username: z.string().optional(),
  password: z.string().min(8),
  humanToken: z.string(),
  humanAnswer: z.string(),
  next: z.string().optional(),
});

export async function registerAction(formData: FormData) {
  const raw = {
    locale: String(formData.get("locale") || "en"),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    fullName: String(formData.get("fullName") || ""),
    username: String(formData.get("username") || "") || undefined,
    password: String(formData.get("password") || ""),
    humanToken: String(formData.get("humanToken") || ""),
    humanAnswer: String(formData.get("humanAnswer") || ""),
    next: String(formData.get("next") || "") || undefined,
  };

  const { locale, email, phone, fullName, username, password, humanToken, humanAnswer, next } =
    registerSchema.parse(raw);
  if (!verifyHumanChallenge(humanToken, humanAnswer)) {
    redirect(`/${locale}/register?error=human`);
  }

  let user;
  try {
    user = await createUser({ email, phone, fullName, username, password, role: "user" });
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") {
      redirect(`/${locale}/register?error=taken`);
    }
    if (e instanceof Error && e.message === "PHONE_TAKEN") {
      redirect(`/${locale}/register?error=phone`);
    }
    if (e instanceof Error && e.message === "USERNAME_TAKEN") {
      redirect(`/${locale}/register?error=username`);
    }
    if (e instanceof Error && e.message === "INVALID_USERNAME") {
      redirect(`/${locale}/register?error=invalid-username`);
    }
    throw e;
  }

  if (user.approvalStatus && user.approvalStatus !== "approved") {
    redirect(`/${locale}/login?error=approval`);
  }
  if (user.isActive === false) {
    redirect(`/${locale}/login?error=inactive`);
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

  // Check if phone verification is required and redirect to verify page
  const wahaEnabled = isWAHAEnabled();
  if (wahaEnabled && !user.isPhoneVerified) {
    redirect(`/${locale}/verify-phone`);
  }

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
