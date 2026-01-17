import crypto from "crypto";

import type { Locale } from "@/lib/i18n/locales";

const SECRET = process.env.HUMAN_CHALLENGE_SECRET || "dev-human-challenge-secret";
const DEFAULT_TTL_MS = 5 * 60 * 1000;

type ChallengeItem = {
  id: string;
  emoji: string;
  labels: { en: string; ar: string };
};

export type HumanChallenge = {
  token: string;
  prompt: string;
  options: Array<{ id: string; emoji: string; label: string }>;
  requiredCount: number;
};

const ITEMS: ChallengeItem[] = [
  { id: "sun", emoji: "☀️", labels: { en: "Sun", ar: "الشمس" } },
  { id: "moon", emoji: "🌙", labels: { en: "Moon", ar: "القمر" } },
  { id: "leaf", emoji: "🍃", labels: { en: "Leaf", ar: "ورقة" } },
  { id: "wave", emoji: "🌊", labels: { en: "Wave", ar: "موجة" } },
  { id: "spark", emoji: "✨", labels: { en: "Spark", ar: "لمعة" } },
  { id: "mount", emoji: "⛰️", labels: { en: "Mountain", ar: "جبل" } },
];

function base64urlEncode(input: string) {
  return Buffer.from(input).toString("base64url");
}

function base64urlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: object) {
  const body = base64urlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token: string) {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  try {
    return JSON.parse(base64urlDecode(body)) as {
      exp: number;
      sequence: string[];
    };
  } catch {
    return null;
  }
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createHumanChallenge(locale: Locale | string, ttlMs = DEFAULT_TTL_MS): HumanChallenge {
  const language = locale === "ar" ? "ar" : "en";
  const options = shuffle(ITEMS).slice(0, 6);
  const sequence = shuffle(options).slice(0, 3).map((item) => item.id);
  const exp = Date.now() + ttlMs;

  const token = sign({ exp, sequence });
  const labels = sequence
    .map((id) => options.find((item) => item.id === id))
    .filter(Boolean)
    .map((item) => item!.labels[language])
    .join(" → ");

  const prompt =
    language === "ar"
      ? `اضغط الرموز بالترتيب: ${labels}`
      : `Tap the icons in order: ${labels}`;

  return {
    token,
    prompt,
    requiredCount: sequence.length,
    options: options.map((item) => ({
      id: item.id,
      emoji: item.emoji,
      label: item.labels[language],
    })),
  };
}

export function verifyHumanChallenge(token: string, answer: string) {
  const payload = verify(token);
  if (!payload) return false;
  if (Date.now() > payload.exp) return false;
  if (!Array.isArray(payload.sequence)) return false;

  const sequence = payload.sequence;
  const provided = answer
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (provided.length !== sequence.length) return false;
  return provided.every((value, index) => value === sequence[index]);
}