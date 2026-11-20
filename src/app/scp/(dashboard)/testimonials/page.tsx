import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PageHeader } from "@/components/scp/PageHeader";
import { TestimonialsFaqManager } from "./TestimonialsFaqManager";

export default async function AdminTestimonialsFaqPage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Testimoni & FAQ" description="Kelola testimoni orang tua/alumni dan pertanyaan yang sering diajukan." />
      <TestimonialsFaqManager userRole={session?.user.role} userUnitId={session?.user.unit_id ?? null} />
    </div>
  );
}
