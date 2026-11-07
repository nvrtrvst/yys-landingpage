"use client";

import type { PPDBUnit } from "./types";

function isRealImage(url: string | null): url is string {
  return !!url && !url.startsWith("/uploads/dummy/");
}

function UnitFallback({ unit }: { unit: PPDBUnit }) {
  return (
    <div className="flex h-40 w-full items-center justify-center bg-primary-50 sm:h-full">
      <span className="text-4xl font-bold text-primary-700" aria-hidden="true">
        {unit.name.charAt(0)}
      </span>
    </div>
  );
}

export function UnitPreview({ unit }: { unit: PPDBUnit | null }) {
  if (!unit) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
        Pilih unit untuk melihat informasi singkatnya.
      </div>
    );
  }

  return (
    <div
      aria-live="polite"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr]">
        {isRealImage(unit.image_url) ? (
          <img
            src={unit.image_url}
            alt={`Foto ${unit.name}`}
            className="h-40 w-full object-cover sm:h-full"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <UnitFallback unit={unit} />
        )}
        <div className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{unit.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {unit.description || "Informasi unit belum tersedia."}
              </p>
            </div>
            {isRealImage(unit.logo_url) ? (
              <img
                src={unit.logo_url}
                alt={`Logo ${unit.name}`}
                className="h-10 w-10 shrink-0 rounded-lg object-contain"
                loading="lazy"
                decoding="async"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
