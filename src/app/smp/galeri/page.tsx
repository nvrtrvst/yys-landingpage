import { notFound } from "next/navigation";
import { UnitListingPage } from "@/components/unit-site/UnitListingPage";
import { UnitGalleryView } from "@/components/unit-site/UnitGalleryView";
import { getUnitGallery } from "@/components/unit-site/unit-site-data";
import { generateUnitListingMetadata } from "@/components/unit-site/unit-site-metadata";

export const revalidate = 60;

export async function generateMetadata() {
  return generateUnitListingMetadata("smp", "galeri");
}

export default async function Page() {
  const data = await getUnitGallery("smp").catch(() => null);
  if (!data) notFound();
  return <UnitListingPage unit={data.unit} title={`Galeri ${data.unit.name}`}><UnitGalleryView galleries={data.galleries} /></UnitListingPage>;
}
