import { notFound } from "next/navigation";
import { UnitListingPage } from "@/components/unit-site/UnitListingPage";
import { UnitMadingDetailView } from "@/components/unit-site/UnitMadingDetailView";
import { getUnitMadingDetail } from "@/components/unit-site/unit-site-data";
import { generateUnitMadingMetadata } from "@/components/unit-site/unit-site-metadata";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return generateUnitMadingMetadata("tk", slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getUnitMadingDetail("tk", slug).catch(() => null);
  if (!data) notFound();
  return <UnitListingPage unit={data.unit} title={data.post.title}><UnitMadingDetailView post={data.post} /></UnitListingPage>;
}
