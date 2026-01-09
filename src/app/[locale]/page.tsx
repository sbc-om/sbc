import { Container } from "@/components/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { notFound } from "next/navigation";

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  return (
    <Container>
      <div className="grid gap-8">
        <div className="grid gap-3">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {dict.home.title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-(--muted-foreground)">
            {dict.home.subtitle}
          </p>
        </div>

        <div className="sbc-card rounded-2xl p-5">
          <label className="block text-sm font-medium text-(--muted-foreground)">
            {dict.home.searchPlaceholder}
          </label>
          <form
            className="mt-2 flex flex-col gap-3 sm:flex-row"
            action={`/${locale}/businesses`}
          >
            <Input
              className="bg-transparent shadow-none"
              placeholder={dict.home.searchPlaceholder}
              name="q"
            />
            <Button type="submit">
              {dict.home.browseAll}
            </Button>
          </form>
        </div>
      </div>
    </Container>
  );
}
