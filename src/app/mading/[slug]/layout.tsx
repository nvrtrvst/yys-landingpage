import { MadingHeader } from "@/components/mading/MadingHeader";
import { MadingFooter } from "@/components/mading/MadingFooter";
import { ThemeProvider } from "@/components/mading/ThemeProvider";
import { getUnitBySlug } from "@/lib/mading";

export const revalidate = 60;

export default async function UnitLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const unit = await getUnitBySlug(slug);
  const branding = unit ? {
    logo_url: unit.logo_url,
    primary_color: unit.primary_color || "#16a34a",
    secondary_color: unit.secondary_color || "#fef08a",
    name: unit.name,
    tagline: unit.tagline,
    slug,
  } : null;

  return (
    <ThemeProvider branding={branding}>
      <MadingHeader />
      {children}
      <MadingFooter />
    </ThemeProvider>
  );
}
