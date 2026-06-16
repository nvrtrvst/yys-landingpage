import { TestimonialsFaqManager } from "./TestimonialsFaqManager";

export default function AdminTestimonialsFaqPage() {
  return (
    <div className="max-w-6xl mx-auto pb-12">
      <h2 className="text-3xl font-bold mb-2 text-gray-800">Testimoni & FAQ</h2>
      <p className="text-gray-500 mb-6">Kelola kesaksian (testimoni) orang tua/alumni dan kumpulan pertanyaan yang sering ditanyakan (FAQ).</p>
      <TestimonialsFaqManager />
    </div>
  );
}
