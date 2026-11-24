export interface PpdbScheduleItem {
  activity: string;
  wave1: string;
  wave2: string;
}

export interface PpdbConfig {
  academic_year: string;
  headmaster_name: string;
  committee_name: string;
  wave1_label: string;
  wave2_label: string;
  schedules: PpdbScheduleItem[];
}

export const DEFAULT_WAVE1_LABEL = "Gelombang 1";
export const DEFAULT_WAVE2_LABEL = "Gelombang 2";

const MAX_ITEMS = 30;
const MAX_TEXT = 120;

function text(value: unknown, max = MAX_TEXT): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parsePpdbConfig(raw: unknown): PpdbConfig | null {
  let source: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      source = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  if (!source || typeof source !== "object") return null;

  const record = source as Record<string, unknown>;
  const schedules = Array.isArray(record.schedules)
    ? record.schedules
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .slice(0, MAX_ITEMS)
        .map((item) => ({ activity: text(item.activity), wave1: text(item.wave1), wave2: text(item.wave2) }))
    : [];

  const config: PpdbConfig = {
    academic_year: text(record.academic_year, 20),
    headmaster_name: text(record.headmaster_name, 150),
    committee_name: text(record.committee_name, 150),
    wave1_label: text(record.wave1_label, 40) || DEFAULT_WAVE1_LABEL,
    wave2_label: text(record.wave2_label, 40) || DEFAULT_WAVE2_LABEL,
    schedules,
  };

  const hasContent = config.academic_year || config.headmaster_name || config.committee_name || schedules.length > 0;
  return hasContent ? config : null;
}

export function scheduleRows(config: PpdbConfig | null): PpdbScheduleItem[] {
  if (!config) return [];
  return config.schedules.filter((item) => item.wave1 || item.wave2);
}

export function activeWaves(config: PpdbConfig | null): { key: "wave1" | "wave2"; label: string }[] {
  const rows = scheduleRows(config);
  if (!config || rows.length === 0) return [];
  const waves: { key: "wave1" | "wave2"; label: string }[] = [];
  if (rows.some((item) => item.wave1)) waves.push({ key: "wave1", label: config.wave1_label });
  if (rows.some((item) => item.wave2)) waves.push({ key: "wave2", label: config.wave2_label });
  return waves;
}

export function registrationWindow(config: PpdbConfig | null): { label: string; value: string }[] {
  const rows = scheduleRows(config);
  if (!config || rows.length === 0) return [];
  const registration = rows.find((item) => /pendaftaran|spmb/i.test(item.activity)) || rows[0];
  return activeWaves(config)
    .map((wave) => ({ label: wave.label, value: registration[wave.key] }))
    .filter((item) => item.value);
}

export function emptyPpdbConfig(): PpdbConfig {
  return {
    academic_year: "",
    headmaster_name: "",
    committee_name: "",
    wave1_label: DEFAULT_WAVE1_LABEL,
    wave2_label: DEFAULT_WAVE2_LABEL,
    schedules: [],
  };
}
export const DEFAULT_PPDB_SCHEDULES: PpdbScheduleItem[] = [
  { activity: "Pendaftaran SPMB", wave1: "", wave2: "" },
  { activity: "Rapat Orang Tua Peserta Didik Baru", wave1: "", wave2: "" },
  { activity: "Daftar Ulang Peserta Didik Baru", wave1: "", wave2: "" },
  { activity: "Seleksi Tes & Penelusuran Pemilihan Jurusan", wave1: "", wave2: "" },
  { activity: "Pengumuman Peserta Didik yang diterima", wave1: "", wave2: "" },
  { activity: "Pembekalan MPLS", wave1: "", wave2: "" },
  { activity: "Pelaksanaan MPLS & Orientasi Ekstrakurikuler", wave1: "", wave2: "" },
  { activity: "Belajar Efektif Tahun Pelajaran", wave1: "", wave2: "" },
];

export function defaultPpdbConfig(): PpdbConfig {
  return {
    academic_year: "",
    headmaster_name: "",
    committee_name: "",
    wave1_label: DEFAULT_WAVE1_LABEL,
    wave2_label: DEFAULT_WAVE2_LABEL,
    schedules: DEFAULT_PPDB_SCHEDULES.map((item) => ({ ...item })),
  };
}
