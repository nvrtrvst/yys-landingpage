"use client";

import { FileText, Loader2, Upload, X } from "lucide-react";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface UploadedDocument {
  key: string;
  url?: string;
  name: string;
  size: number;
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentField({
  id,
  label,
  hint,
  accept,
  status,
  error,
  file,
  preview = false,
  onSelect,
  onRemove,
}: {
  id: string;
  label: string;
  hint: string;
  accept: string;
  status: UploadStatus;
  error?: string;
  file?: UploadedDocument;
  preview?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const inputId = `${id}-file`;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label} <span className="text-xs font-normal text-gray-400">(opsional)</span>
      </label>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2" aria-live="polite">
        <input
          id={inputId}
          type="file"
          accept={accept}
          disabled={status === "uploading"}
          className="peer sr-only"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) onSelect(selected);
            event.target.value = "";
          }}
        />
        <label
          htmlFor={inputId}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {file ? "Ganti file" : "Pilih file"}
        </label>

        {status === "uploading" ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Mengunggah…
          </span>
        ) : null}

        {status === "success" && file ? (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
            <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="max-w-[12rem] truncate">{file.name}</span>
            <span className="shrink-0 text-emerald-600">({formatBytes(file.size)})</span>
            <button
              type="button"
              onClick={onRemove}
              className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded text-emerald-700 hover:bg-emerald-100"
              aria-label={`Hapus ${label}`}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </span>
        ) : null}

        {status === "error" ? (
          <span role="alert" className="text-xs text-rose-600">
            {error || "Gagal mengunggah. Coba lagi."}
          </span>
        ) : null}
      </div>

      {preview && status === "success" && file?.url ? (
        <img
          src={file.url}
          alt={`Pratinjau ${label}`}
          className="mt-2 h-16 w-16 rounded-lg border border-gray-200 object-cover"
        />
      ) : null}
    </div>
  );
}
