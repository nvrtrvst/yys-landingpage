import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarLayout } from "./SidebarLayout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/scp/login");
  }

  const allowed = ["superadmin", "admin", "admin_unit", "editor"];
  if (!allowed.includes(session.user.role)) {
    redirect("/");
  }

  const userRole = session.user.role || "editor";

  return (
    <SidebarLayout userRole={userRole} userName={session.user?.name}>
      {children}
    </SidebarLayout>
  );
}
