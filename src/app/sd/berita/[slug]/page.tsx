import { notFound } from "next/navigation";
import { UnitNewsDetail } from "@/components/unit-site/UnitNewsDetail";
import { getUnitNewsDetail } from "@/components/unit-site/unit-site-data";
import { generateUnitNewsMetadata } from "@/components/unit-site/unit-site-metadata";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return generateUnitNewsMetadata(slug, "sd");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getUnitNewsDetail(slug, "sd").catch(() => null);
  if (!data) notFound();
  return <UnitNewsDetail {...data} />;
}
