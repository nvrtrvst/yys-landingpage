import { notFound } from "next/navigation";
import { UnitListingPage } from "@/components/unit-site/UnitListingPage";
import { getUnitAgenda } from "@/components/unit-site/unit-site-data";
import { generateUnitListingMetadata } from "@/components/unit-site/unit-site-metadata";

export const revalidate = 60;

export async function generateMetadata() {
  return generateUnitListingMetadata("smp", "agenda");
}

export default async function Page() {
  const data = await getUnitAgenda("smp").catch(() => null);
  if (!data) notFound();
  return (
    <UnitListingPage unit={data.unit} title={`Agenda ${data.unit.name}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.events.map((item) => (
          <div key={item.id} className="unit-site-card">
            <div style={{ fontWeight: 700 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: "#66756b", marginTop: 4 }}>
              {new Date(item.start_date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {item.location ? ` · ${item.location}` : ""}
            </div>
            {item.description ? <div style={{ marginTop: 8, lineHeight: 1.6 }}>{item.description}</div> : null}
          </div>
        ))}
        {data.events.length === 0 ? <p style={{ color: "#66756b" }}>Belum ada agenda mendatang untuk unit ini.</p> : null}
      </div>
    </UnitListingPage>
  );
}
