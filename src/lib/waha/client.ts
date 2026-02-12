/**
 * WAHA (WhatsApp HTTP API) Client
 * Handles sending WhatsApp messages via WAHA API
 */

const WAHA_API_URL = process.env.WAHA_API_URL || "https://waha.sbc.om/api";
const WAHA_SESSION = process.env.WAHA_SESSION || "SBC";
const WAHA_API_KEY = process.env.WAHA_API_KEY || "";
const WAHA_ENABLED = process.env.WAHA_ENABLED === "true";

export interface WAHAResponse {
  id: {
    fromMe: boolean;
    remote: string;
    id: string;
    _serialized: string;
  };
  ack: number;
  body: string;
  type: string;
  timestamp: number;
  from: string;
  to: string;
}

export interface SendTextOptions {
  chatId: string;
  text: string;
  replyTo?: string | null;
  linkPreview?: boolean;
}

export interface SendImageOptions {
  chatId: string;
  imageUrl?: string;
  imageBase64?: string;
  mimetype?: string;
  filename?: string;
  caption?: string;
  replyTo?: string | null;
}

/**
 * Check if WAHA is enabled and configured
 */
export function isWAHAEnabled(): boolean {
  return WAHA_ENABLED && !!WAHA_API_KEY && !!WAHA_API_URL;
}

/**
 * Format phone number to WhatsApp chat ID format
 * @param phone Phone number (can include + or country code)
 * @returns Chat ID in format "number@c.us"
 */
export function formatChatId(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  // Remove leading zeros
  const normalized = digits.replace(/^0+/, "");
  return `${normalized}@c.us`;
}

/**
 * Send a text message via WhatsApp
 */
export async function sendText(options: SendTextOptions): Promise<WAHAResponse> {
  if (!isWAHAEnabled()) {
    throw new Error("WAHA is not enabled or not configured");
  }

  const response = await fetch(`${WAHA_API_URL}/sendText`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Api-Key": WAHA_API_KEY,
    },
    body: JSON.stringify({
      chatId: options.chatId,
      reply_to: options.replyTo ?? null,
      text: options.text,
      linkPreview: options.linkPreview ?? false,
      linkPreviewHighQuality: false,
      session: WAHA_SESSION,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[WAHA] Send error:", error);
    throw new Error(`WAHA API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Send an image via WhatsApp
 */
export async function sendImage(options: SendImageOptions): Promise<WAHAResponse> {
  if (!isWAHAEnabled()) {
    throw new Error("WAHA is not enabled or not configured");
  }

  const file: Record<string, string> = {
    mimetype: options.mimetype || "image/jpeg",
    filename: options.filename || "image.jpg",
  };

  if (options.imageUrl) {
    file.url = options.imageUrl;
  } else if (options.imageBase64) {
    file.data = options.imageBase64;
  } else {
    throw new Error("Either imageUrl or imageBase64 must be provided");
  }

  const response = await fetch(`${WAHA_API_URL}/sendImage`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Api-Key": WAHA_API_KEY,
    },
    body: JSON.stringify({
      chatId: options.chatId,
      file,
      reply_to: options.replyTo ?? null,
      caption: options.caption || "",
      session: WAHA_SESSION,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[WAHA] Send image error:", error);
    throw new Error(`WAHA API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Send OTP code via WhatsApp
 */
export async function sendOTP(phone: string, code: string, locale: "en" | "ar" = "en"): Promise<WAHAResponse> {
  const chatId = formatChatId(phone);
  
  const messages = {
    en: `🔐 Your SBC verification code:\n\n\`${code}\`\n\nThis code will expire in 2 minutes.\n\nDo not share this code with anyone.`,
    ar: `🔐 رمز التحقق الخاص بك في SBC:\n\n\`${code}\`\n\nستنتهي صلاحية هذا الرمز خلال 2 دقائق.\n\nلا تشارك هذا الرمز مع أي شخص.`,
  };

  return sendText({
    chatId,
    text: messages[locale],
  });
}

/**
 * Send welcome message after successful registration
 */
export async function sendWelcome(phone: string, name: string, locale: "en" | "ar" = "en"): Promise<WAHAResponse> {
  const chatId = formatChatId(phone);
  
  const messages = {
    en: `🎉 Welcome to SBC, ${name}!\n\nYour account has been verified successfully.\n\nThank you for joining us!`,
    ar: `🎉 مرحباً بك في SBC، ${name}!\n\nتم التحقق من حسابك بنجاح.\n\nشكراً لانضمامك إلينا!`,
  };

  return sendText({
    chatId,
    text: messages[locale],
  });
}

/**
 * Send login notification
 */
export async function sendLoginNotification(
  phone: string, 
  locale: "en" | "ar" = "en",
  method: "password" | "whatsapp" | "passkey" = "password"
): Promise<WAHAResponse> {
  const chatId = formatChatId(phone);
  const now = new Date();
  const dateStr = now.toLocaleDateString(locale === "ar" ? "ar-OM" : "en-OM", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  
  const methodNames: Record<string, { en: string; ar: string }> = {
    password: { en: "Password", ar: "كلمة المرور" },
    whatsapp: { en: "WhatsApp OTP", ar: "رمز واتساب" },
    passkey: { en: "Passkey", ar: "مفتاح المرور" },
  };
  
  const methodName = locale === "ar" ? methodNames[method]?.ar : methodNames[method]?.en;
  
  const messages = {
    en: `🔐 *New Login - SBC*

📅 Date: ${dateStr}
🔑 Login Method: ${methodName}

If you didn't perform this login, please change your password immediately.

https://sbc.om`,
    ar: `🔐 *تسجيل دخول جديد - SBC*

📅 التاريخ: ${dateStr}
🔑 طريقة الدخول: ${methodName}

إذا لم تقم بهذا الدخول، يرجى تغيير كلمة المرور فوراً.

https://sbc.om`,
  };

  return sendText({
    chatId,
    text: messages[locale],
  });
}

// ==================== Loyalty Points Notifications ====================

export interface LoyaltyPointsNotificationOptions {
  phone: string;
  customerName: string;
  businessName: string;
  points: number;
  delta: number;
  type: "earn" | "deduct" | "redeem";
  locale?: "en" | "ar";
}

/**
 * Send loyalty points update notification via WhatsApp
 * Professional notification for when customers earn, lose, or redeem points
 */
export async function sendLoyaltyPointsNotification(
  options: LoyaltyPointsNotificationOptions
): Promise<WAHAResponse | null> {
  if (!isWAHAEnabled()) {
    console.log("[WAHA] WhatsApp notifications disabled, skipping loyalty notification");
    return null;
  }

  if (!options.phone) {
    console.log("[WAHA] No phone number provided, skipping loyalty notification");
    return null;
  }

  const chatId = formatChatId(options.phone);
  const locale = options.locale || "en";
  const absDelta = Math.abs(options.delta);

  let message: string;

  if (options.type === "earn") {
    // Points earned (positive)
    message = locale === "ar" 
      ? `🎉 *مبروك ${options.customerName}!*

لقد حصلت على *${absDelta} نقطة* جديدة من *${options.businessName}*! 🌟

📊 *رصيد نقاطك الحالي:* ${options.points} نقطة

استمر في جمع النقاط للحصول على مكافآت رائعة! 🎁

شكراً لولائك 💚`
      : `🎉 *Congratulations ${options.customerName}!*

You've earned *${absDelta} point${absDelta > 1 ? "s" : ""}* from *${options.businessName}*! 🌟

📊 *Your current balance:* ${options.points} point${options.points !== 1 ? "s" : ""}

Keep collecting points for amazing rewards! 🎁

Thank you for your loyalty 💚`;
  } else if (options.type === "deduct") {
    // Points deducted (negative adjustment)
    message = locale === "ar"
      ? `📝 *تحديث رصيد النقاط*

مرحباً ${options.customerName}،

تم خصم *${absDelta} نقطة* من رصيدك في *${options.businessName}*

📊 *رصيد نقاطك الحالي:* ${options.points} نقطة

إذا كان لديك أي استفسار، يرجى التواصل معنا 📞`
      : `📝 *Points Balance Update*

Hi ${options.customerName},

*${absDelta} point${absDelta > 1 ? "s" : ""}* ${absDelta > 1 ? "have" : "has"} been deducted from your balance at *${options.businessName}*

📊 *Your current balance:* ${options.points} point${options.points !== 1 ? "s" : ""}

If you have any questions, please contact us 📞`;
  } else {
    // Points redeemed
    message = locale === "ar"
      ? `✨ *تم استبدال النقاط بنجاح!*

مرحباً ${options.customerName}،

لقد استخدمت *${absDelta} نقطة* في *${options.businessName}* 🎁

📊 *رصيد نقاطك المتبقي:* ${options.points} نقطة

نتمنى لك تجربة ممتعة! 🌟

شكراً لاختيارك لنا 💚`
      : `✨ *Points Redeemed Successfully!*

Hi ${options.customerName},

You've used *${absDelta} point${absDelta > 1 ? "s" : ""}* at *${options.businessName}* 🎁

📊 *Your remaining balance:* ${options.points} point${options.points !== 1 ? "s" : ""}

Enjoy your reward! 🌟

Thank you for choosing us 💚`;
  }

  try {
    const result = await sendText({ chatId, text: message });
    console.log(`[WAHA] Loyalty notification sent to ${options.phone}:`, options.type);
    return result;
  } catch (error) {
    console.error(`[WAHA] Failed to send loyalty notification:`, error);
    throw error;
  }
}
