import { notFound } from "next/navigation";
import { UnitListingPage } from "@/components/unit-site/UnitListingPage";
import { UnitMadingView } from "@/components/unit-site/UnitMadingView";
import { getUnitMadingPosts } from "@/components/unit-site/unit-site-data";
import { generateUnitListingMetadata } from "@/components/unit-site/unit-site-metadata";

export const revalidate = 60;

export async function generateMetadata() {
  return generateUnitListingMetadata("smp", "mading");
}

export default async function Page() {
  const data = await getUnitMadingPosts("smp").catch(() => null);
  if (!data) notFound();
  return <UnitListingPage unit={data.unit} title={`Tulisan ${data.unit.name}`}><UnitMadingView slug="smp" posts={data.posts} /></UnitListingPage>;
}
