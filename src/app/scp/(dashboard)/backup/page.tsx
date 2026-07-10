"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Database, Download, CheckCircle, AlertTriangle } from "lucide-react";

export default function BackupPage() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleBackup = async () => {
    try {
      setIsDownloading(true);
      const toastId = toast.loading("Memproses backup database...");

      const res = await fetch("/api/admin/backup", {
        method: "GET",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal mengunduh backup");
      }

      // Handle file download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Get filename from content-disposition header if available
      const disposition = res.headers.get("content-disposition");
      let filename = "backup.bak";
      if (disposition && disposition.indexOf("filename=") !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Backup berhasil diunduh!", { id: toastId });
    } catch(error: unknown) {
      console.error(error);
      toast.error((error instanceof Error ? error.message : String(error)) || "Terjadi kesalahan saat membackup database");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Backup Database</h1>
        <p className="text-gray-600 mt-1">Unduh salinan keseluruhan database Anda untuk keamanan dan pemulihan.</p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Database SQL (.bak)</h3>
              <p className="mt-1 text-sm text-gray-500">
                Fitur ini akan mengekspor seluruh struktur tabel dan data ke dalam satu file tunggal berekstensi <strong>.bak</strong>. File ini dapat direstore melalui alat manajemen database seperti phpMyAdmin atau command line MySQL.
              </p>
              
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-700 font-medium">Penting:</p>
                </div>
                <p className="mt-1 text-sm text-yellow-700">Simpan file backup Anda di tempat yang aman. File backup berisikan semua data sensitif termasuk informasi pendaftar dan pengguna sistem.</p>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleBackup}
                  disabled={isDownloading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white transition-colors
                    ${isDownloading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {isDownloading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses Backup...
                    </>
                  ) : (
                    <>
                      <Download className="-ml-1 mr-2 h-4 w-4" />
                      Unduh Backup Database (.bak)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-sm text-gray-500">Sistem backup beroperasi normal.</span>
        </div>
      </div>
    </div>
  );
}
