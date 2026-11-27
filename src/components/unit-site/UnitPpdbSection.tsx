import Link from "next/link";
import { activeWaves, currentScheduleRows, registrationWindow, type PpdbConfig } from "@/lib/ppdb-config";
import type { UnitSiteUnit } from "@/components/unit-site/unit-site-data";

export function UnitPpdbSection({ unit, config, whatsapp }: { unit: UnitSiteUnit; config: PpdbConfig | null; whatsapp: string | null }) {
  const rows = currentScheduleRows(config);
  if (!config || rows.length === 0) return null;

  const currentConfig = { ...config, schedules: rows };
  const waves = activeWaves(currentConfig);
  const windows = rows.some((row) => /pendaftaran|spmb/i.test(row.activity)) ? registrationWindow(currentConfig) : [];
  const ppdbHref = `/ppdb?unit=${unit.slug}`;

  return (
    <section id="pendaftaran" className="unit-site-section" style={{ background: "#f3f7f2" }}>
      <div className="unit-site-container">
        <h2 className="unit-site-h2">Pendaftaran SPMB {config.academic_year}</h2>
        {windows.length ? (
          <div className="unit-site-wave-chips">
            {windows.map((item) => (
              <span key={item.label} className="unit-site-wave-chip">
                <strong>{item.label}</strong> {item.value}
              </span>
            ))}
          </div>
        ) : null}

        <div className="unit-site-ppdb-grid">
          <div>
            <table className="unit-site-schedule">
              <thead>
                <tr>
                  <th scope="col">Kegiatan</th>
                  {waves.map((wave) => <th key={wave.key} scope="col">{wave.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.activity}-${index}`}>
                    <td data-label="Kegiatan">{row.activity || "-"}</td>
                    {waves.map((wave) => <td key={wave.key} data-label={wave.label}>{row[wave.key] || "-"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside>
            <h3 className="unit-site-h3">Alur Pendaftaran</h3>
            <ol className="unit-site-steps">
              <li><span className="unit-site-step-no">1</span><span>Isi formulir pendaftaran online</span></li>
              <li><span className="unit-site-step-no">2</span><span>Unggah dokumen persyaratan</span></li>
              <li><span className="unit-site-step-no">3</span><span>Verifikasi &amp; tes seleksi</span></li>
              <li><span className="unit-site-step-no">4</span><span>Daftar ulang</span></li>
            </ol>
            <div className="unit-site-ppdb-actions">
              <Link href={ppdbHref} className="unit-site-cta">Daftar Online</Link>
              {whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="unit-site-cta-outline">Tanya via WhatsApp</a> : null}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
