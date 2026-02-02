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
    en: `🔐 Your SBC verification code is: *${code}*\n\nThis code will expire in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.\n\nDo not share this code with anyone.`,
    ar: `🔐 رمز التحقق الخاص بك في SBC هو: *${code}*\n\nستنتهي صلاحية هذا الرمز خلال ${process.env.OTP_EXPIRY_MINUTES || 5} دقائق.\n\nلا تشارك هذا الرمز مع أي شخص.`,
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
export async function sendLoginNotification(phone: string, locale: "en" | "ar" = "en"): Promise<WAHAResponse> {
  const chatId = formatChatId(phone);
  const now = new Date().toLocaleString(locale === "ar" ? "ar-OM" : "en-US");
  
  const messages = {
    en: `🔔 New login to your SBC account\n\nTime: ${now}\n\nIf this wasn't you, please secure your account immediately.`,
    ar: `🔔 تسجيل دخول جديد إلى حسابك في SBC\n\nالوقت: ${now}\n\nإذا لم تكن أنت، يرجى تأمين حسابك فوراً.`,
  };

  return sendText({
    chatId,
    text: messages[locale],
  });
}
