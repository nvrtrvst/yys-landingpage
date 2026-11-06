import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { firstAccessibleHref } from "@/lib/modules";
import { SignOutButton } from "../(dashboard)/SignOutButton";

export default async function NoAccessPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/scp/login");

  const href = firstAccessibleHref(session.user.role, session.user.permissions ?? []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Belum ada akses</h1>
        <p className="mt-2 text-sm text-slate-500">
          Akun Anda belum diberi akses modul. Hubungi admin untuk mengatur permission.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {href ? (
            <Link
              href={href}
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              Buka menu yang tersedia
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
