import { describe, expect, it } from "vitest";
import { canSeeNavItem, navSections, dashboardItem, type NavItem } from "@/lib/sidebar-nav";

const allItems: NavItem[] = navSections.flatMap((section) => section.items);

function itemNamed(name: string): NavItem {
  const found = allItems.find((item) => item.name === name);
  if (!found) throw new Error(`Menu tidak ditemukan: ${name}`);
  return found;
}

describe("navSections", () => {
  it("keeps every href pointing at a real admin route", () => {
    for (const item of [...allItems, dashboardItem]) {
      const path = item.href.split("?")[0];
      expect(path.startsWith("/scp")).toBe(true);
    }
  });

  it("uses unique hrefs so only one menu item can be active", () => {
    const hrefs = allItems.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("orders groups by daily work", () => {
    expect(navSections.map((section) => section.label)).toEqual([
      "Konten Publik",
      "Penerimaan Siswa",
      "Website & Identitas",
      "Mading",
      "Akun & Sistem",
    ]);
  });

  it("groups all unit website settings together", () => {
    expect(itemNamed("Jadwal PPDB").href).toBe("/scp/units?tab=ppdb");
    expect(itemNamed("Jadwal PPDB").group).toBe("Website Unit Sekolah");
    expect(itemNamed("Identitas & Tampilan").group).toBe("Website Unit Sekolah");
    expect(itemNamed("Program Unggulan").href).toBe("/scp/units?tab=programs");
    expect(itemNamed("Foto & Video").href).toBe("/scp/units?tab=media");
  });
});

describe("canSeeNavItem", () => {
  it("shows everything to superadmin and admin", () => {
    expect(canSeeNavItem(itemNamed("Pengguna & Hak Akses"), "admin", [])).toBe(true);
    expect(canSeeNavItem(itemNamed("Website Yayasan"), "superadmin", [])).toBe(true);
  });

  it("hides unit PPDB schedule from editors who cannot manage units", () => {
    expect(canSeeNavItem(itemNamed("Jadwal PPDB"), "editor", [])).toBe(false);
    expect(canSeeNavItem(itemNamed("Berita & Artikel"), "editor", [])).toBe(true);
  });

  it("limits petugas to granted modules plus profile", () => {
    expect(canSeeNavItem(itemNamed("Berita & Artikel"), "petugas", ["news"])).toBe(true);
    expect(canSeeNavItem(itemNamed("Pengguna & Hak Akses"), "petugas", ["users"])).toBe(false);
    expect(canSeeNavItem(itemNamed("Profil Saya"), "petugas", [])).toBe(true);
  });
});
