import { notFound } from "next/navigation";
import Link from "next/link";

import { Container } from "@/components/Container";
import { PageContainer } from "@/components/PageContainer";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  return (
    <PageContainer>
      <Container>
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              {dict.contact.title}
            </h1>
            <p className="mt-2 text-base text-(--muted-foreground)">
              {dict.contact.subtitle}
            </p>
          </div>
          <Link
            href={`/${locale}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {locale === "ar" ? "العودة للرئيسية" : "Back to home"}
          </Link>
        </div>

        {/* Description */}
        <div className="mt-6 sbc-card rounded-2xl p-6">
          <p className="text-sm leading-7 text-foreground">
            {dict.contact.description}
          </p>
        </div>

        {/* Main Content */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Contact Form */}
          <div className="sbc-card rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight mb-6">
              {dict.contact.formTitle}
            </h2>
            <form className="grid gap-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                >
                  {dict.contact.name}
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder={
                    locale === "ar" ? "أدخل اسمك" : "Enter your name"
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                >
                  {dict.contact.email}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={
                    locale === "ar"
                      ? "your@email.com"
                      : "your@email.com"
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium mb-2"
                >
                  {dict.contact.subject}
                </label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder={
                    locale === "ar"
                      ? "موضوع الرسالة"
                      : "Message subject"
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium mb-2"
                >
                  {dict.contact.message}
                </label>
                <Textarea
                  id="message"
                  name="message"
                  rows={6}
                  placeholder={
                    locale === "ar"
                      ? "اكتب رسالتك هنا..."
                      : "Write your message here..."
                  }
                  required
                />
              </div>

              <Button type="submit" variant="primary" size="md">
                {dict.contact.send}
              </Button>
            </form>
          </div>

          {/* Contact Info Sidebar */}
          <aside className="space-y-6">
            {/* Contact Information */}
            <div className="sbc-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold tracking-tight mb-4">
                {dict.contact.info}
              </h3>
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <svg
                      className="h-5 w-5 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground) mb-1">
                      {dict.contact.email}
                    </div>
                    <a
                      href="mailto:info@sbc.om"
                      className="text-sm font-medium text-foreground hover:text-accent transition-colors break-all"
                    >
                      info@sbc.om
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-2/10">
                    <svg
                      className="h-5 w-5 text-accent-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground) mb-1">
                      {dict.contact.phone}
                    </div>
                    <a
                      href="tel:+96891200634"
                      className="text-sm font-medium text-foreground hover:text-accent-2 transition-colors"
                    >
                      +968 91 200 634
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <svg
                      className="h-5 w-5 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground) mb-1">
                      {dict.contact.address}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {locale === "ar"
                        ? "عمان - مسقط"
                        : "Oman - Muscat"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="sbc-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold tracking-tight mb-4">
                {dict.contact.social}
              </h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href={process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-(--surface-border) bg-(--surface) text-(--muted-foreground) shadow-(--shadow) hover:text-foreground hover:scale-110 transition-all"
                  aria-label="Instagram"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                  >
                    <path
                      d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M17.5 6.5h.01"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </a>

                <a
                  href={process.env.NEXT_PUBLIC_SOCIAL_GITHUB || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-(--surface-border) bg-(--surface) text-(--muted-foreground) shadow-(--shadow) hover:text-foreground hover:scale-110 transition-all"
                  aria-label="GitHub"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                  >
                    <path
                      d="M9 19c-4 1.5-4-2-5-2m10 4v-3.5c0-1 .1-1.5-.5-2 2-.2 4-.8 4-4.5 0-1-.3-2-1-2.8.1-.3.4-1.3-.1-2.7 0 0-.8-.2-2.8 1a9.6 9.6 0 0 0-5 0c-2-1.2-2.8-1-2.8-1-.5 1.4-.2 2.4-.1 2.7-.7.8-1 1.8-1 2.8 0 3.7 2 4.3 4 4.5-.4.3-.5.8-.5 1.5V21"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="sbc-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold tracking-tight mb-4">
                {locale === "ar" ? "روابط سريعة" : "Quick Links"}
              </h3>
              <nav className="space-y-2">
                <Link
                  href={`/${locale}/businesses`}
                  className="block text-sm text-foreground hover:text-accent transition-colors py-1"
                >
                  {dict.nav.businesses}
                </Link>
                <Link
                  href={`/${locale}/about`}
                  className="block text-sm text-foreground hover:text-accent transition-colors py-1"
                >
                  {locale === "ar" ? "عن المشروع" : "About"}
                </Link>
              </nav>
            </div>
          </aside>
        </div>
      </Container>
    </PageContainer>
  );
}
