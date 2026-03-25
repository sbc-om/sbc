"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiOutlineArrowRight, HiOutlineDownload, HiOutlineTicket } from "react-icons/hi";

import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/locales";

type CustomerCard = {
  cardId: string;
  customerName: string;
  points: number;
  businessName: string;
  businessLogoUrl?: string;
};

type Step = "phone" | "otp" | "cards";

export function CustomerCardLoginClient({
  locale,
  joinCode,
  businessName,
}: {
  locale: Locale;
  joinCode: string;
  businessName: string;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const otpRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [cards, setCards] = useState<CustomerCard[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(true);

  const copy = useMemo(
    () => ({
      title: ar ? "دخول العملاء" : "Customer Card Login",
        subtitle: ar
          ? `دخول عملاء ${businessName}: أدخل رقم هاتفك، وصلك كود عبر واتساب، وبعد التحقق افتح بطاقتك.`
          : `${businessName} customer access: enter your phone, verify the WhatsApp code, then open your loyalty card.`,
      phoneLabel: ar ? "رقم الهاتف" : "Phone number",
      phonePlaceholder: ar ? "مثال: 91234567" : "Example: 91234567",
      sendCode: ar ? "إرسال الكود عبر واتساب" : "Send WhatsApp Code",
      otpLabel: ar ? "رمز التحقق" : "Verification code",
      otpPlaceholder: ar ? "6 أرقام" : "6 digits",
      verifyCode: ar ? "تحقق وفتح البطاقة" : "Verify & Continue",
      resend: ar ? "إعادة إرسال الكود" : "Resend code",
      resendIn: ar ? "إعادة الإرسال خلال" : "Resend in",
      seconds: ar ? "ث" : "s",
      back: ar ? "رجوع" : "Back",
      cardsTitle: ar ? "بطاقاتك" : "Your Cards",
      chooseCard: ar ? "اختر البطاقة التي تريد فتحها" : "Choose the card you want to open",
      openCard: ar ? "فتح البطاقة" : "Open Card",
      qrTitle: ar ? "QR دخول العملاء" : "Customer Login QR",
      qrDesc: ar
        ? "حمّل هذا الـ QR واطبعه على ورقة ليصل العملاء مباشرة إلى صفحة دخول هذا البزنس."
        : "Download this QR and print it so customers can open this business login page directly.",
      qrDownload: ar ? "تحميل QR للطباعة" : "Download QR for Print",
      qrLinkLabel: ar ? "رابط الصفحة" : "Page link",
      qrGenerating: ar ? "جارٍ إنشاء QR..." : "Generating QR...",
      notFound: ar
        ? "لم نجد بطاقة مرتبطة بهذا الرقم."
        : "No loyalty card found for this phone number.",
      sendErrors: {
        BUSINESS_NOT_FOUND: ar ? "البزنس غير موجود." : "Business not found.",
        TOO_MANY_REQUESTS: ar ? "انتظر قليلاً قبل طلب كود جديد." : "Please wait before requesting another code.",
        WHATSAPP_UNAVAILABLE: ar ? "خدمة واتساب غير متاحة حالياً." : "WhatsApp service is currently unavailable.",
        SEND_FAILED: ar ? "تعذر إرسال الكود. حاول مرة أخرى." : "Failed to send code. Please try again.",
      },
      verifyErrors: {
        BUSINESS_NOT_FOUND: ar ? "البزنس غير موجود." : "Business not found.",
        INVALID_CODE: ar ? "الكود غير صحيح." : "Invalid code.",
        OTP_NOT_FOUND: ar ? "الكود منتهي أو غير موجود. اطلب كوداً جديداً." : "Code expired or missing. Request a new code.",
        MAX_ATTEMPTS_EXCEEDED: ar ? "تم تجاوز عدد المحاولات. اطلب كوداً جديداً." : "Too many attempts. Request a new code.",
        NO_CARDS_FOUND: ar ? "لا توجد بطاقة مرتبطة بهذا الرقم." : "No card linked to this phone number.",
      },
    }),
    [ar, businessName]
  );

  useEffect(() => {
    let canceled = false;

    async function generateQr() {
      setQrBusy(true);
      try {
        const origin = window.location.origin;
        const customerLoginUrl = `${origin}/${locale}/loyalty/customer-login/${encodeURIComponent(joinCode)}`;
        const qr = await import("qrcode");
        const dataUrl = await qr.toDataURL(customerLoginUrl, {
          width: 380,
          margin: 2,
          errorCorrectionLevel: "M",
        });
        if (!canceled) setQrDataUrl(dataUrl);
      } catch {
        if (!canceled) setQrDataUrl(null);
      } finally {
        if (!canceled) setQrBusy(false);
      }
    }

    void generateQr();

    return () => {
      canceled = true;
    };
  }, [joinCode, locale]);

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `customer-login-${joinCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (step === "otp") {
      otpRef.current?.focus();
    }
  }, [step]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/loyalty/customer-auth/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode, phone: phone.trim(), locale }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(copy.sendErrors[data.error as keyof typeof copy.sendErrors] || (ar ? "خطأ غير متوقع." : "Unexpected error."));
        return;
      }

      setStep("otp");
      setCountdown(60);
    } catch {
      setError(ar ? "خطأ في الشبكة. حاول مرة أخرى." : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/loyalty/customer-auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode, phone: phone.trim(), code: otp }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(copy.verifyErrors[data.error as keyof typeof copy.verifyErrors] || (ar ? "فشل التحقق." : "Verification failed."));
        return;
      }

      const foundCards = (data.cards ?? []) as CustomerCard[];
      setCards(foundCards);

      if (foundCards.length === 1) {
        router.push(`/${locale}/loyalty/card/${foundCards[0].cardId}`);
        return;
      }

      setStep("cards");
    } catch {
      setError(ar ? "خطأ في الشبكة. حاول مرة أخرى." : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.title}</h1>
        <p className="mt-2 text-sm text-(--muted-foreground)">{copy.subtitle}</p>
      </div>

      {step === "phone" && (
        <form onSubmit={sendCode} className="sbc-card rounded-2xl p-5 sm:p-6">
          <label className="block text-sm font-medium text-(--muted-foreground)">{copy.phoneLabel}</label>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            placeholder={copy.phonePlaceholder}
            className="mt-2"
            required
            locale={ar ? "ar" : "en"}
          />

          {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          <Button type="submit" className="mt-4 w-full" disabled={loading || !phone.trim()}>
            {loading ? (ar ? "جاري الإرسال..." : "Sending...") : copy.sendCode}
          </Button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verifyCode} className="sbc-card rounded-2xl p-5 sm:p-6">
          <div className={cn("mb-3 flex items-center justify-between", ar ? "flex-row-reverse" : "") }>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError(null);
              }}
              className="text-sm text-(--muted-foreground) hover:text-foreground"
            >
              {copy.back}
            </button>
            <span className="text-sm text-(--muted-foreground)" dir="ltr">{phone}</span>
          </div>

          <label className="block text-sm font-medium text-(--muted-foreground)">{copy.otpLabel}</label>
          <Input
            ref={otpRef}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder={copy.otpPlaceholder}
            inputMode="numeric"
            dir="ltr"
            className="mt-2 text-center text-lg tracking-[0.4em]"
            maxLength={6}
          />

          {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          <Button type="submit" className="mt-4 w-full" disabled={loading || otp.length !== 6}>
            {loading ? (ar ? "جاري التحقق..." : "Verifying...") : copy.verifyCode}
          </Button>

          <button
            type="button"
            className="mt-3 w-full text-sm text-(--muted-foreground) hover:text-foreground disabled:opacity-50"
            onClick={() => void sendCode()}
            disabled={countdown > 0 || loading}
          >
            {countdown > 0 ? `${copy.resendIn} ${countdown}${copy.seconds}` : copy.resend}
          </button>
        </form>
      )}

      {step === "cards" && (
        <div className="sbc-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{copy.cardsTitle}</h2>
            <p className="mt-1 text-sm text-(--muted-foreground)">{copy.chooseCard}</p>
          </div>

          {!cards.length ? (
            <p className="text-sm text-(--muted-foreground)">{copy.notFound}</p>
          ) : (
            <div className="grid gap-3">
              {cards.map((card) => (
                <div key={card.cardId} className="rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                  <div className={cn("flex items-start justify-between gap-3", ar ? "flex-row-reverse text-right" : "") }>
                    <div>
                      <div className="text-sm font-semibold">{card.businessName}</div>
                      <div className="mt-0.5 text-xs text-(--muted-foreground)">{card.customerName}</div>
                    </div>
                    <div className="rounded-lg bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                      {card.points} {ar ? "نقطة" : "pts"}
                    </div>
                  </div>

                  <Link
                    href={`/${locale}/loyalty/card/${card.cardId}`}
                    className={buttonVariants({ variant: "secondary", size: "sm", className: "mt-3 w-full justify-center" })}
                  >
                    <HiOutlineTicket className="h-4 w-4" />
                    {copy.openCard}
                    <HiOutlineArrowRight className={cn("h-4 w-4", ar ? "rotate-180" : "")} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="sbc-card rounded-2xl p-5 sm:p-6">
        <h2 className="text-base font-semibold">{copy.qrTitle}</h2>
        <p className="mt-1 text-sm text-(--muted-foreground)">{copy.qrDesc}</p>

        <div className="mt-4 flex justify-center">
          <div className="rounded-xl border border-(--surface-border) bg-white p-3">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Customer login QR" className="h-44 w-44" />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center text-xs text-(--muted-foreground)">
                {copy.qrGenerating}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <Button type="button" variant="secondary" onClick={downloadQr} disabled={!qrDataUrl || qrBusy}>
            <HiOutlineDownload className="h-4 w-4" />
            {copy.qrDownload}
          </Button>
          <div className="text-xs text-(--muted-foreground)" dir="ltr">
            {copy.qrLinkLabel}: {`/${locale}/loyalty/customer-login/${joinCode}`}
          </div>
        </div>
      </div>
    </div>
  );
}
