"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { UnitsTab } from "./UnitsTab";
import { ProgramsTab } from "./ProgramsTab";
import { UnitMediaTab } from "./UnitMediaTab";
import { UnitPpdbTab } from "./UnitPpdbTab";
import { UnitTabs } from "./UnitTabs";
import { parseUnitTab, type UnitTab } from "@/lib/unit-navigation";

export type Unit = { id: number, name: string, slug: string, description: string, content: string, image_url: string, logo_url: string, og_image: string | null, primary_color: string, secondary_color: string, tagline: string, hero_title: string | null, hero_subtitle: string | null, history_html: string, vision: string, mission: string, profile_image: string, stat_students: string, stat_founded: string, hero_background: string, programs_background: string, carousel_images: string[], youtube_url: string, address: string, phone: string, contact_email: string, social_instagram: string, social_facebook: string, social_youtube: string, map_embed_url: string, map_coordinates: string, wa_number: string, wa_message: string, order_index: number, status: string, updated_at?: string };
export type Program = { id: number, title: string, description: string, image_url: string, unit_id: number | null, order_index: number, status: string, unit_name?: string };

export function UnitsManager({ userRole }: { userRole?: string }) {
  return (
    <Suspense fallback={<div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">Memuat pengaturan unit...</div>}>
      <UnitsManagerContent userRole={userRole} />
    </Suspense>
  );
}

function UnitsManagerContent({ userRole }: { userRole?: string }) {
  const activeTab: UnitTab = parseUnitTab(useSearchParams().get("tab"));
  const [units, setUnits] = useState<Unit[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          fetch('/api/admin/units'),
          fetch('/api/admin/programs'),
        ]);
        if (cancelled) return;
        const unitData = await uRes.json().catch(() => ({}));
        if (!uRes.ok) throw new Error(typeof unitData.error === 'string' ? unitData.error : 'Data unit gagal dimuat. Coba lagi atau hubungi administrator server.');
        setUnits(unitData);
        if (pRes.ok) setPrograms(await pRes.json());
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : 'Data unit gagal dimuat. Periksa koneksi internet, lalu coba lagi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          fetch('/api/admin/units'),
          fetch('/api/admin/programs'),
        ]);
        const unitData = await uRes.json().catch(() => ({}));
        if (!uRes.ok) throw new Error(typeof unitData.error === 'string' ? unitData.error : 'Data unit gagal dimuat. Coba lagi atau hubungi administrator server.');
        setUnits(unitData);
        if (pRes.ok) setPrograms(await pRes.json());
      } catch (err) {
        console.error(err);
        setLoadError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : 'Data unit gagal dimuat. Periksa koneksi internet, lalu coba lagi.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <UnitTabs active={activeTab} />
      
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Memuat data...</div>
        ) : loadError ? (
          <div role="alert" className="space-y-3 text-sm text-rose-800">
            <p>{loadError}</p>
            <button type="button" onClick={fetchData} className="min-h-11 rounded border border-rose-200 px-4">Coba muat ulang</button>
          </div>
        ) : (
          <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {activeTab === 'units' && <UnitsTab units={units} refresh={fetchData} userRole={userRole} />}
            {activeTab === 'programs' && <ProgramsTab programs={programs} units={units} refresh={fetchData} />}
            {activeTab === 'media' && <UnitMediaTab units={units} refresh={fetchData} userRole={userRole} />}
            {activeTab === 'ppdb' && <UnitPpdbTab units={units} refresh={fetchData} userRole={userRole} />}
          </div>
        )}
      </div>
    </div>
  );
}
