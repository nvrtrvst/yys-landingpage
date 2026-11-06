import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { logError } from "@/lib/errors";

const KEU_URL = process.env.KEUANGAN_API_URL || "http://localhost:3000";
const KEU_KEY = process.env.KEUANGAN_INTEGRATION_KEY;

type SyncResult = {
  ok: boolean;
  skipped?: boolean;
  alreadyExists?: boolean;
  warnings?: string[];
  externalId?: string | null;
  error?: string;
};

function mapGender(gender: string): "L" | "P" {
  return gender === "Perempuan" ? "P" : "L";
}

function toDateOnly(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

async function markFailed(id: number, message: string): Promise<SyncResult> {
  await pool.execute(
    "UPDATE ppdb_submissions SET sync_status = 'failed', sync_error = ?, sync_attempts = sync_attempts + 1 WHERE id = ?",
    [message.slice(0, 500), id]
  );
  return { ok: false, error: message };
}

export async function syncPpdbSubmission(
  id: number,
  opts: { force?: boolean } = {}
): Promise<SyncResult> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, registration_number, status, sync_status, nisn, student_name, gender,
            birth_date, address, phone, email, father_name, guardian_name, unit, grade, major
     FROM ppdb_submissions WHERE id = ?`,
    [id]
  );
  const submission = rows[0];
  if (!submission) return { ok: false, error: "Data pendaftar tidak ditemukan" };

  if (submission.sync_status === "success" && !opts.force) {
    return { ok: true, skipped: true };
  }
  if (!KEU_KEY) {
    return markFailed(id, "Integrasi SIM Keuangan belum dikonfigurasi");
  }

  const payload = {
    registrationNumber: submission.registration_number,
    nisn: submission.nisn || null,
    unit: submission.unit,
    name: submission.student_name,
    gender: mapGender(submission.gender),
    birthDate: toDateOnly(submission.birth_date),
    parentName: submission.father_name || submission.guardian_name || submission.student_name,
    parentPhone: submission.phone,
    parentEmail: submission.email || null,
    address: submission.address,
    major: submission.major || null,
    grade: submission.grade || null,
  };

  try {
    const res = await fetch(`${KEU_URL}/api/integration/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEU_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        typeof data?.error === "string" && data.error
          ? data.error
          : `SIM Keuangan menolak permintaan (HTTP ${res.status})`;
      return markFailed(id, message);
    }

    const warnings: string[] = Array.isArray(data?.data?.warnings) ? data.data.warnings : [];
    const externalId: string | null = data?.data?.id ?? null;
    await pool.execute(
      `UPDATE ppdb_submissions
       SET sync_status = 'success', sync_warning = ?, sync_error = NULL, synced_at = NOW(),
           sync_attempts = sync_attempts + 1, sync_external_id = ?
       WHERE id = ?`,
      [warnings.length > 0 ? warnings.join(" ") : null, externalId, id]
    );

    return { ok: true, alreadyExists: !!data?.alreadyExists, warnings, externalId };
  } catch (error) {
    logError(error, "SIM sync");
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "SIM Keuangan tidak merespons (timeout)"
        : "Gagal menghubungi SIM Keuangan";
    return markFailed(id, message);
  }
}
