import { describe, expect, it } from "vitest";
import { isPlaceholderContent, isPlaceholderGalleryTitle, isReadyNews, readyUnitText } from "@/lib/unit-content-readiness";

describe("unit content readiness", () => {
  it("suppresses known sample copy without hiding real school copy", () => {
    expect(readyUnitText("Hero")).toBe("");
    expect(isPlaceholderContent("<p>Lorem ipsum dolor sit amet</p>")).toBe(true);
    expect(readyUnitText("Belajar, Bermain, Tumbuh dalam Islam")).toBe("Belajar, Bermain, Tumbuh dalam Islam");
  });

  it("keeps test news and wallpaper titles out of the homepage", () => {
    expect(isReadyNews("Judul Berita", "Lorem ipsum dolor sit amet consectetur adipiscing elit")).toBe(false);
    expect(isReadyNews("te", "awdaw")).toBe(false);
    expect(isPlaceholderGalleryTitle("wp13639912-microsoft-pc-wallpapers")).toBe(true);
    expect(isReadyNews("Kegiatan belajar Al-Quran", "Siswa mengikuti kegiatan belajar Al-Quran di kelas pagi.")).toBe(true);
  });
});
