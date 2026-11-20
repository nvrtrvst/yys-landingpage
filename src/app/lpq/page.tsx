import { notFound } from "next/navigation";
import { UnitSite } from "@/components/unit-site/UnitSite";
import { getUnitSiteData } from "@/components/unit-site/unit-site-data";
import { generateUnitSiteMetadata } from "@/components/unit-site/unit-site-metadata";

export const revalidate = 60;

export async function generateMetadata() {
  return generateUnitSiteMetadata("lpq");
}

export default async function LPQPage() {
  const data = await getUnitSiteData("lpq").catch(() => null);
  if (!data) notFound();
  return <UnitSite {...data} />;
}
