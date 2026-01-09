import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { AnimatedHeader } from "@/components/AnimatedHeader";

export async function Header({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const user = await getCurrentUser();

  return <AnimatedHeader locale={locale} dict={dict} user={user} />;
}
