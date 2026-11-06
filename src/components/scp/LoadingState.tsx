import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-hidden="true" />
      <p className="mt-2 text-sm text-slate-500">{label}</p>
    </div>
  );
}
