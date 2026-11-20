import { notFound } from "next/navigation";
import { UnitSite } from "@/components/unit-site/UnitSite";
import { getUnitSiteData } from "@/components/unit-site/unit-site-data";
import { generateUnitSiteMetadata } from "@/components/unit-site/unit-site-metadata";

export const revalidate = 60;

export async function generateMetadata() {
  return generateUnitSiteMetadata("tk");
}

export default async function TKPage() {
  const data = await getUnitSiteData("tk").catch(() => null);
  if (!data) notFound();
  return <UnitSite {...data} />;
}
