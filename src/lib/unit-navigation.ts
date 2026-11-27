export const UNIT_TABS = ["units", "programs", "media", "ppdb"] as const;
export type UnitTab = typeof UNIT_TABS[number];

export const UNIT_PAGE_CONTENT: Record<UnitTab, { title: string; description: string }> = {
  units: { title: "Website Unit Sekolah", description: "Kelola identitas, profil, tampilan, dan kontak setiap unit sekolah." },
  programs: { title: "Program Unggulan", description: "Kelola program yayasan dan program khusus tiap unit sekolah." },
  media: { title: "Foto & Video Unit", description: "Kelola carousel foto dan video YouTube untuk website unit sekolah." },
  ppdb: { title: "Jadwal Pendaftaran Unit", description: "Atur tahun pelajaran, gelombang, dan jadwal yang tampil di website tiap unit." },
};

export function parseUnitTab(value: string | null | undefined): UnitTab {
  return UNIT_TABS.find((tab) => tab === value) ?? "units";
}

export function parseUnitId(value: string | null | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function unitTabHref(tab: UnitTab, unitId?: number | null): string {
  const params = new URLSearchParams();
  if (tab !== "units") params.set("tab", tab);
  if (unitId && Number.isSafeInteger(unitId) && unitId > 0) params.set("unit", String(unitId));
  const query = params.toString();
  return query ? `/scp/units?${query}` : "/scp/units";
}