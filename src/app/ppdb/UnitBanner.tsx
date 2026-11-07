"use client";

import Link from "next/link";
import type { PPDBUnit } from "./types";

function isRealImage(url: string | null): url is string {
  return !!url && !url.startsWith("/uploads/dummy/");
}

export function UnitBanner({
  unit,
  onChangeUnit,
}: {
  unit: PPDBUnit;
  onChangeUnit: () => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-primary-50/50 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
          {isRealImage(unit.logo_url) ? (
            <img
              src={unit.logo_url}
              alt={`Logo ${unit.name}`}
              className="h-full w-full object-contain p-1"
              loading="lazy"
              decoding="async"
            />
          ) : isRealImage(unit.image_url) ? (
            <img
              src={unit.image_url}
              alt={`Foto ${unit.name}`}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="text-lg font-bold text-primary-700" aria-hidden="true">
              {unit.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Pendaftaran PPDB</p>
          <p className="truncate text-sm font-semibold text-slate-900">{unit.name}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        <Link
          href={`/unit/${unit.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary-700 hover:underline"
        >
          Lihat profil unit
        </Link>
        <button
          type="button"
          onClick={onChangeUnit}
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Ganti unit
        </button>
      </div>
    </div>
  );
}
