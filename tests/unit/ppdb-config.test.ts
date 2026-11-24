import { describe, expect, it } from "vitest";
import {
  DEFAULT_WAVE1_LABEL,
  DEFAULT_WAVE2_LABEL,
  activeWaves,
  parsePpdbConfig,
  registrationWindow,
  scheduleRows,
} from "@/lib/ppdb-config";

describe("parsePpdbConfig", () => {
  it("accepts a JSON string and fills default wave labels", () => {
    const config = parsePpdbConfig(JSON.stringify({
      academic_year: "2026-2027",
      schedules: [{ activity: "Pendaftaran SPMB", wave1: "1 Maret", wave2: "" }],
    }));
    expect(config?.academic_year).toBe("2026-2027");
    expect(config?.wave1_label).toBe(DEFAULT_WAVE1_LABEL);
    expect(config?.wave2_label).toBe(DEFAULT_WAVE2_LABEL);
    expect(config?.schedules).toHaveLength(1);
  });

  it("keeps custom wave labels", () => {
    const config = parsePpdbConfig({ academic_year: "2026", wave1_label: "Gelombang A", wave2_label: "Gelombang B" });
    expect(config?.wave1_label).toBe("Gelombang A");
    expect(config?.wave2_label).toBe("Gelombang B");
  });

  it("returns null for broken or empty input", () => {
    expect(parsePpdbConfig(null)).toBeNull();
    expect(parsePpdbConfig("")).toBeNull();
    expect(parsePpdbConfig("{not json")).toBeNull();
    expect(parsePpdbConfig({})).toBeNull();
  });

  it("trims text and drops malformed schedule rows", () => {
    const config = parsePpdbConfig({ academic_year: "  2026-2027  ", schedules: [null, "x", { activity: "  Daftar Ulang  ", wave1: " 1 Mei " }] });
    expect(config?.academic_year).toBe("2026-2027");
    expect(config?.schedules).toEqual([{ activity: "Daftar Ulang", wave1: "1 Mei", wave2: "" }]);
  });
});

describe("schedule helpers", () => {
  const config = parsePpdbConfig({
    academic_year: "2026-2027",
    schedules: [
      { activity: "Pendaftaran SPMB", wave1: "1 Maret - 24 April", wave2: "28 April - 3 Juli" },
      { activity: "Rapat Orang Tua", wave1: "", wave2: "" },
      { activity: "Pengumuman", wave2: "10 Juli" },
    ],
  });

  it("keeps only rows with a date", () => {
    expect(scheduleRows(config)).toHaveLength(2);
  });

  it("reports only waves that have data", () => {
    const waves = activeWaves(config);
    expect(waves.map((wave) => wave.key)).toEqual(["wave1", "wave2"]);
  });

  it("reads registration window from the Pendaftaran row", () => {
    expect(registrationWindow(config)).toEqual([
      { label: DEFAULT_WAVE1_LABEL, value: "1 Maret - 24 April" },
      { label: DEFAULT_WAVE2_LABEL, value: "28 April - 3 Juli" },
    ]);
  });

  it("returns empty lists for null config", () => {
    expect(scheduleRows(null)).toEqual([]);
    expect(activeWaves(null)).toEqual([]);
    expect(registrationWindow(null)).toEqual([]);
  });
});