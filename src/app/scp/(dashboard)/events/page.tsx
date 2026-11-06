import { PageHeader } from "@/components/scp/PageHeader";
import { EventsClient } from "./EventsClient";

export default function AdminEventsPage() {
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Kalender Agenda (Events)" description="Kelola agenda yayasan dan jadwal kegiatan penting." />
      <EventsClient />
    </div>
  );
}
