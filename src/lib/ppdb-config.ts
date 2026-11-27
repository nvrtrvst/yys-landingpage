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

const MONTHS: Record<string, number> = {
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
  juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
};

export function scheduleLastDate(value: string): Date | null {
  const matches = [...value.matchAll(/\b(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(20\d{2})\b/gi)];
  const last = matches.at(-1);
  if (last) {
    const date = new Date(Date.UTC(Number(last[3]), MONTHS[last[2].toLowerCase()], Number(last[1])));
    return date.getUTCDate() === Number(last[1]) ? date : null;
  }
  const iso = [...value.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)].at(-1);
  if (!iso) return null;
  const date = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  return date.getUTCFullYear() === Number(iso[1]) && date.getUTCMonth() === Number(iso[2]) - 1 && date.getUTCDate() === Number(iso[3]) ? date : null;
}

export function currentScheduleRows(config: PpdbConfig | null, today = new Date()): PpdbScheduleItem[] {
  if (!config || !/^20\d{2}\s*[-/]\s*20\d{2}$/.test(config.academic_year)) return [];
  const startOfToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return scheduleRows(config).map((row) => {
    const isCurrent = (value: string) => {
      const lastDate = scheduleLastDate(value);
      return !!lastDate && lastDate.getTime() >= startOfToday;
    };
    return {
      ...row,
      wave1: isCurrent(row.wave1) ? row.wave1 : "",
      wave2: isCurrent(row.wave2) ? row.wave2 : "",
    };
  }).filter((row) => row.wave1 || row.wave2);
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
