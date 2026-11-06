import { PageHeader } from "@/components/scp/PageHeader";
import { UnitsManager } from "./UnitsManager";

export default function AdminUnitsPage() {
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Manajemen Unit & Program" description="Kelola unit sekolah dan program-program unggulan yayasan." />
      <UnitsManager />
    </div>
  );
}
