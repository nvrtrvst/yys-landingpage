import { UnitsManager } from "./UnitsManager";

export default function AdminUnitsPage() {
  return (
    <div className="max-w-6xl mx-auto pb-12">
      <h2 className="text-3xl font-bold mb-2 text-gray-800">Manajemen Unit & Program</h2>
      <p className="text-gray-500 mb-6">Kelola unit sekolah (TK, SD, SMP, SMA, dsb) dan program-program unggulan yayasan.</p>
      <UnitsManager />
    </div>
  );
}
