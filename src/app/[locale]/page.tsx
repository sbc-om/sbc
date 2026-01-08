import { Container } from "@/components/Container";
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
          <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
            {dict.home.subtitle}
          </p>
        </div>

        <div className="rounded-2xl border p-5 shadow-(--shadow) bg-(--surface) border-(--surface-border)">
          <label className="block text-sm font-medium text-(--muted-foreground)">
            {dict.home.searchPlaceholder}
          </label>
          <form
            className="mt-2 flex flex-col gap-3 sm:flex-row"
            action={`/${locale}/businesses`}
          >
            <input
              className="h-11 w-full rounded-xl border px-4 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-300 bg-transparent border-(--surface-border) dark:placeholder:text-zinc-500"
              placeholder={dict.home.searchPlaceholder}
              name="q"
            />
            <button className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
              {dict.home.browseAll}
            </button>
          </form>
        </div>
      </div>
    </Container>
  );
}
