"use client";
import { useState, useEffect, useCallback } from "react";
import { UnitsTab } from "./UnitsTab";
import { ProgramsTab } from "./ProgramsTab";
import { UnitMediaTab } from "./UnitMediaTab";

export type Unit = { id: number, name: string, slug: string, description: string, content: string, image_url: string, logo_url: string, primary_color: string, secondary_color: string, tagline: string, history_html: string, vision: string, mission: string, profile_image: string, stat_students: string, stat_founded: string, hero_background: string, programs_background: string, carousel_images: string[], youtube_url: string, address: string, phone: string, contact_email: string, social_instagram: string, social_facebook: string, social_youtube: string, map_embed_url: string, map_coordinates: string, wa_number: string, wa_message: string, order_index: number, status: string };
export type Program = { id: number, title: string, description: string, image_url: string, unit_id: number | null, order_index: number, status: string, unit_name?: string };

export function UnitsManager({ userRole }: { userRole?: string }) {
  const [activeTab, setActiveTab] = useState<'units' | 'programs' | 'media'>('units');
  const [units, setUnits] = useState<Unit[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          fetch('/api/admin/units'),
          fetch('/api/admin/programs'),
        ]);
        if (cancelled) return;
        if (uRes.ok) setUnits(await uRes.json());
        if (pRes.ok) setPrograms(await pRes.json());
      } catch (err) {
        console.error(err);
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
    (async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          fetch('/api/admin/units'),
          fetch('/api/admin/programs'),
        ]);
        if (uRes.ok) setUnits(await uRes.json());
        if (pRes.ok) setPrograms(await pRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex border-b">
        <button 
          className={`flex-1 py-4 text-center font-semibold ${activeTab === 'units' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('units')}
        >
          Unit Sekolah
        </button>
        <button 
          className={`flex-1 py-4 text-center font-semibold ${activeTab === 'programs' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('programs')}
        >
          Program Unggulan
        </button>
        <button 
          className={`flex-1 py-4 text-center font-semibold ${activeTab === 'media' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('media')}
        >
          Media Unit
        </button>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Memuat data...</div>
        ) : (
          <>
            {activeTab === 'units' && <UnitsTab units={units} refresh={fetchData} userRole={userRole} />}
            {activeTab === 'programs' && <ProgramsTab programs={programs} units={units} refresh={fetchData} />}
            {activeTab === 'media' && <UnitMediaTab units={units} refresh={fetchData} userRole={userRole} />}
          </>
        )}
      </div>
    </div>
  );
}
