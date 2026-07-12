"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export default function MadingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/mading/auth">
      <div className="min-h-screen flex flex-col">{children}</div>
      <Toaster position="top-center" richColors closeButton />
    </SessionProvider>
  );
}
