import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PageHeader } from "@/components/scp/PageHeader";
import { UnitsManager } from "./UnitsManager";

export default async function AdminUnitsPage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Manajemen Unit & Program" description="Kelola unit sekolah dan program-program unggulan yayasan." />
      <UnitsManager userRole={session?.user.role} />
    </div>
  );
}
