import { EventsClient } from "./EventsClient";

export default function AdminEventsPage() {
  return (
    <div className="max-w-6xl mx-auto pb-12">
      <h2 className="text-3xl font-bold mb-2 text-gray-800">Kalender Agenda (Events)</h2>
      <p className="text-gray-500 mb-6">Kelola agenda yayasan dan jadwal kegiatan penting.</p>
      <EventsClient />
    </div>
  );
}
