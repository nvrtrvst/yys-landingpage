import { PageHeader } from "@/components/scp/PageHeader";
import { TestimonialsFaqManager } from "./TestimonialsFaqManager";

export default function AdminTestimonialsFaqPage() {
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Testimoni & FAQ" description="Kelola testimoni orang tua/alumni dan pertanyaan yang sering diajukan." />
      <TestimonialsFaqManager />
    </div>
  );
}
