import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PageHeader } from "@/components/scp/PageHeader";
import { UnitsManager } from "./UnitsManager";
import { parseUnitTab, UNIT_PAGE_CONTENT } from "@/lib/unit-navigation";

export default async function AdminUnitsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getServerSession(authOptions);
  const content = UNIT_PAGE_CONTENT[parseUnitTab((await searchParams).tab)];
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title={content.title} description={content.description} />
      <UnitsManager userRole={session?.user.role} />
    </div>
  );
}
