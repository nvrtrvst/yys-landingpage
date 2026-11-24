import { activeWaves, registrationWindow, scheduleRows, type PpdbConfig } from "@/lib/ppdb-config";

export function PpdbScheduleCard({ config }: { config: PpdbConfig | null }) {
  const rows = scheduleRows(config);
  if (!config || rows.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Jadwal PPDB unit ini belum diisi panitia.</p>
        <p className="mt-1">Hubungi panitia sekolah untuk informasi tanggal pendaftaran terbaru.</p>
      </div>
    );
  }

  const waves = activeWaves(config);
  const windows = registrationWindow(config);

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <h3 className="text-base font-bold text-emerald-900">Jadwal SPMB {config.academic_year}</h3>
      {windows.length ? (
        <p className="mt-1 text-sm text-emerald-800">
          {windows.map((item) => `${item.label}: ${item.value}`).join(" · ")}
        </p>
      ) : null}
      <div className="mt-3 divide-y divide-emerald-200 overflow-hidden rounded-lg border border-emerald-200 bg-white">
        {rows.map((row, index) => (
          <div key={`${row.activity}-${index}`} className="grid grid-cols-1 gap-1 p-3 text-sm sm:grid-cols-3">
            <div className="font-semibold text-gray-800">{row.activity || "-"}</div>
            {waves.map((wave) => (
              <div key={wave.key} className="text-gray-600">
                <span className="text-xs font-medium text-gray-500 sm:hidden">{wave.label}: </span>
                {row[wave.key] || "-"}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}