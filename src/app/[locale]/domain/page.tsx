import { redirect, notFound } from "next/navigation";
import { getBusinessByDomain } from "@/lib/db/businesses";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ host?: string }>;
}

export default async function DomainPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { host } = await searchParams;

  if (!host) {
    notFound();
  }

  const business = await getBusinessByDomain(host);

  if (!business) {
    notFound();
  }

  // Redirect to the business page
  redirect(`/${locale}/directory/businesses/${business.id}`);
}
