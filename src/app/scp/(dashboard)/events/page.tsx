import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PageHeader } from "@/components/scp/PageHeader";
import { EventsClient } from "./EventsClient";

export default async function AdminEventsPage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Kalender Agenda (Events)" description="Kelola agenda yayasan dan jadwal kegiatan penting." />
      <EventsClient userRole={session?.user.role} userUnitId={session?.user.unit_id ?? null} />
    </div>
  );
}
