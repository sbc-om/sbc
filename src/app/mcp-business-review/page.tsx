import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { defaultLocale, isLocale } from "@/lib/i18n/locales";

export default async function RootMcpBusinessReviewPage() {
  const headerList = await headers();
  const headerLocale = headerList.get("x-locale") ?? defaultLocale;
  const locale = isLocale(headerLocale) ? headerLocale : defaultLocale;

  redirect(`/${locale}/mcp-business-review`);
}