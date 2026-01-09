import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { requireUser } from "@/lib/auth/requireUser";
import { listCategories } from "@/lib/db/categories";
import { AppPage } from "@/components/AppPage";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CategorySelectField } from "@/components/CategorySelectField";
import { submitBusinessRequestAction } from "./actions";

export default async function BusinessRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireUser(locale as Locale);
  await getDictionary(locale as Locale);

  const sp = await searchParams;
  const success = sp.success === "1";

  const categories = listCategories({ locale: locale as Locale });

  return (
    <AppPage>
        <h1 className="text-2xl font-semibold tracking-tight">
          {locale === "ar" ? "طلب إضافة عمل" : "Request a Business Listing"}
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground)">
          {locale === "ar"
            ? "املأ النموذج وسنراجع الطلب."
            : "Fill the form and we will review your request."}
        </p>

        {success ? (
          <div className="mt-6 sbc-card rounded-2xl p-5">
            <div className="font-semibold">
              {locale === "ar" ? "تم إرسال الطلب" : "Request submitted"}
            </div>
            <p className="mt-1 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? "سنقوم بمراجعته قريباً."
                : "We will review it shortly."}
            </p>
          </div>
        ) : null}

        <form
          action={submitBusinessRequestAction.bind(null, locale as Locale)}
          className="mt-6 grid gap-4"
        >
          <Input
            name="name"
            placeholder={locale === "ar" ? "اسم العمل" : "Business name"}
            required
          />

          <Textarea
            name="description"
            placeholder={locale === "ar" ? "وصف" : "Description"}
            rows={5}
          />

          <CategorySelectField
            categories={categories}
            locale={locale as Locale}
            placeholder={locale === "ar" ? "اختر تصنيفاً" : "Choose a category"}
            searchPlaceholder={
              locale === "ar" ? "ابحث عن تصنيف..." : "Search categories..."
            }
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="city" placeholder={locale === "ar" ? "المدينة" : "City"} />
            <Input name="phone" placeholder={locale === "ar" ? "الهاتف" : "Phone"} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="email" placeholder={locale === "ar" ? "البريد" : "Email"} />
            <Input name="website" placeholder={locale === "ar" ? "الموقع" : "Website"} />
          </div>

          <div className="flex justify-end">
            <Button type="submit">
              {locale === "ar" ? "إرسال" : "Submit"}
            </Button>
          </div>
        </form>
    </AppPage>
  );
}
