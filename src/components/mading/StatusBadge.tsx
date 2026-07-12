"use client";
interface Props { status: string; }
const MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-200 text-gray-700" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Disetujui", color: "bg-green-100 text-green-700" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-700" },
  revision: { label: "Revisi", color: "bg-blue-100 text-blue-700" },
};
export function StatusBadge({ status }: Props) {
  const c = MAP[status] || { label: status, color: "bg-gray-200" };
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.color}`}>{c.label}</span>;
}
