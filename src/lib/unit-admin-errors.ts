import { AppError, handleApiError, logError } from "@/lib/errors";

export function handleUnitAdminError(error: unknown): Response {
  if (error instanceof AppError) {
    if (error.statusCode === 401) return Response.json({ error: "Sesi login Anda sudah berakhir. Masuk kembali, lalu coba simpan lagi." }, { status: 401 });
    if (error.statusCode === 403 && error.message === "Dilarang") return Response.json({ error: "Anda tidak memiliki izin untuk mengubah unit ini. Hubungi admin yayasan." }, { status: 403 });
    return handleApiError(error);
  }

  logError(error, "Pengaturan unit");
  const code = error instanceof Error && "code" in error ? error.code : undefined;
  let status = 500;
  let errorCode = "UNIT_REQUEST_FAILED";
  let message = "Pengaturan unit belum dapat diproses. Coba lagi. Jika tetap gagal, hubungi administrator server dengan kode UNIT_REQUEST_FAILED.";

  if (code === "ER_BAD_FIELD_ERROR") {
    status = 503;
    errorCode = "UNIT_MIGRATION_REQUIRED";
    message = "Pembaruan database pengaturan unit belum lengkap. Minta administrator server menjalankan migration_unit_site_settings.sql pada database aplikasi, lalu muat ulang halaman.";
  } else if (code === "ER_NO_SUCH_TABLE") {
    status = 503;
    errorCode = "UNIT_DATABASE_SETUP_REQUIRED";
    message = "Data pengaturan unit belum tersedia di database. Hubungi administrator server untuk memeriksa instalasi database aplikasi.";
  } else if (["ECONNREFUSED", "ETIMEDOUT", "ECONNRESET", "EHOSTUNREACH", "ENOTFOUND", "PROTOCOL_CONNECTION_LOST", "ER_CON_COUNT_ERROR", "ER_ACCESS_DENIED_ERROR", "ER_BAD_DB_ERROR"].includes(String(code))) {
    status = 503;
    errorCode = "UNIT_DATABASE_UNAVAILABLE";
    message = "Server belum dapat terhubung ke database. Tunggu sebentar lalu coba lagi. Jika tetap gagal, minta administrator server memeriksa layanan dan koneksi database.";
  } else if (code === "ER_DUP_ENTRY") {
    status = 400;
    errorCode = "UNIT_SLUG_USED";
    message = "Slug (URL) unit sudah digunakan. Pilih slug lain, lalu simpan kembali.";
  } else if (code === "ER_DATA_TOO_LONG") {
    status = 400;
    errorCode = "UNIT_FIELD_TOO_LONG";
    message = "Ada isian yang terlalu panjang untuk disimpan. Perpendek isian tersebut, lalu simpan kembali.";
  } else if (code === "ER_LOCK_DEADLOCK" || code === "ER_LOCK_WAIT_TIMEOUT") {
    status = 409;
    errorCode = "UNIT_SAVE_BUSY";
    message = "Data unit sedang diperbarui oleh proses lain. Tunggu sebentar, muat ulang data terbaru, lalu simpan kembali.";
  } else if (code === "ER_ROW_IS_REFERENCED_2") {
    status = 409;
    errorCode = "UNIT_IN_USE";
    message = "Unit belum dapat dihapus karena masih digunakan oleh data lain. Hubungi admin yayasan untuk memeriksa keterkaitan data.";
  } else if (error instanceof SyntaxError) {
    status = 400;
    errorCode = "UNIT_INVALID_REQUEST";
    message = "Data yang dikirim tidak dapat dibaca. Muat ulang halaman, lalu coba kembali.";
  }

  return Response.json({ error: message, code: errorCode }, { status });
}

const FIELD_LABELS: Record<string, string> = {
  name: "Nama Unit", slug: "Slug (URL)", hero_title: "Judul Hero", hero_subtitle: "Subjudul Hero",
  og_image: "Gambar Pratinjau Tautan (OG)", primary_color: "Warna Utama", secondary_color: "Warna Aksen",
  order_index: "Urutan Tampil", status: "Status", youtube_url: "Video YouTube", carousel_images: "Gambar Carousel",
};

export function unitValidationResponse(issues: readonly { path: readonly PropertyKey[]; message: string }[]): Response {
  const fields = [...new Set(issues.map((issue) => FIELD_LABELS[String(issue.path[0])] || "Isian unit"))];
  const hints: Record<string, string> = {
    name: "Nama Unit wajib diisi.", slug: "Slug (URL) wajib diisi.",
    hero_title: "Judul Hero maksimal 120 karakter.", hero_subtitle: "Subjudul Hero maksimal 300 karakter.",
    og_image: "Gambar OG harus berupa hasil unggahan atau alamat gambar HTTP/HTTPS yang valid.",
    primary_color: "Pilih Warna Utama yang valid.", secondary_color: "Pilih Warna Aksen yang valid.",
    order_index: "Urutan Tampil harus berupa bilangan bulat.",
    youtube_url: "Video YouTube harus memakai alamat youtube.com atau youtu.be.",
    carousel_images: "Carousel hanya boleh berisi maksimal 8 gambar.",
    status: "Status unit harus Aktif atau Nonaktif.",
  };
  const messages = [...new Set(issues.map((issue) => hints[String(issue.path[0])] || "Periksa kembali format isian unit."))];
  return Response.json({
    error: `Pengaturan belum dapat disimpan. ${messages.slice(0, 3).join(" ")}`,
    code: "UNIT_VALIDATION_FAILED",
    fields,
  }, { status: 400 });
}
