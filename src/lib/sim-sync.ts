import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { logError } from "@/lib/errors";
import { logPpdbActivity, SYSTEM_ACTOR, type PpdBActor } from "@/lib/ppdb-activity";

const KEU_URL = process.env.KEUANGAN_API_URL || "http://localhost:3000";
const KEU_KEY = process.env.KEUANGAN_INTEGRATION_KEY;
const KEU_TIMEOUT_MS = Number(process.env.KEU_SYNC_TIMEOUT_MS || 8000);

 type SyncResult = {
   ok: boolean;
   skipped?: boolean;
   alreadyExists?: boolean;
   updated?: boolean;
   warnings?: string[];
   externalId?: string | null;
   classId?: string | null;
   className?: string | null;
   error?: string;
 };

function mapGender(gender: string): "L" | "P" {
  return gender === "Perempuan" ? "P" : "L";
}

function toDateOnly(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

async function logSync(ppdbId: number, action: string, status: string, message: string | null): Promise<void> {
  try {
    await pool.execute(
      "INSERT INTO ppdb_sync_logs (ppdb_id, action, status, message) VALUES (?, ?, ?, ?)",
      [ppdbId, action, status, message]
    );
  } catch (error) {
    logError(error, "SIM sync log");
  }
}

async function markFailed(id: number, message: string, actor: PpdBActor): Promise<SyncResult> {
  await pool.execute(
    "UPDATE ppdb_submissions SET sync_status = 'failed', sync_error = ?, sync_warning = NULL, sync_attempts = sync_attempts + 1 WHERE id = ?",
    [message.slice(0, 500), id]
  );
  await logSync(id, "sync", "failed", message.slice(0, 500));
  await logPpdbActivity({ ppdbId: id, action: "sync_failed", note: message.slice(0, 500), actor });
  return { ok: false, error: message };
}

export async function syncPpdbSubmission(
  id: number,
  opts: { force?: boolean; actor?: PpdBActor; trigger?: "auto" | "manual" } = {}
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
  const actor = opts.actor ?? SYSTEM_ACTOR;

  if (!KEU_KEY) {
    return markFailed(id, "Integrasi SIM Keuangan belum dikonfigurasi", actor);
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
      signal: AbortSignal.timeout(KEU_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        typeof data?.error === "string" && data.error
          ? data.error
          : `SIM Keuangan menolak permintaan (HTTP ${res.status})`;
      return markFailed(id, message, actor);
    }

    const warnings: string[] = Array.isArray(data?.data?.warnings) ? data.data.warnings : [];
    const externalId: string | null = data?.data?.id ?? null;
    const classId: string | null = typeof data?.data?.classId === "string" && data.data.classId ? data.data.classId : null;
    const className: string | null = typeof data?.data?.className === "string" && data.data.className ? data.data.className : null;
    await pool.execute(
      `UPDATE ppdb_submissions
       SET sync_status = 'success', sync_warning = ?, sync_error = NULL, synced_at = NOW(),
           sync_attempts = sync_attempts + 1, sync_external_id = ?,
           sync_class_id = ?, sync_class_name = ?
       WHERE id = ?`,
      [warnings.length > 0 ? warnings.join(" ") : null, externalId, classId, className, id]
    );
    await logSync(
      id,
      "sync",
      data?.alreadyExists ? "alreadyExists" : "success",
      warnings.length > 0 ? warnings.join(" ") : null
    );
    await logPpdbActivity({
      ppdbId: id,
      action: opts.trigger === "manual" ? "sync_manual" : "sync_auto",
      note: warnings.length > 0 ? warnings.join(" ") : data?.alreadyExists ? "Data sudah ada di SIM." : null,
      actor,
    });

    return {
      ok: true,
      alreadyExists: !!data?.alreadyExists,
      updated: !!data?.updated,
      warnings,
      externalId,
      classId,
      className,
    };
  } catch (error) {
    logError(error, "SIM sync");
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "SIM Keuangan tidak merespons (timeout)"
        : "Gagal menghubungi SIM Keuangan";
    return markFailed(id, message, actor);
  }
}

export async function deactivatePpdbStudent(id: number, actor: PpdBActor = SYSTEM_ACTOR): Promise<void> {
  if (!KEU_KEY) return;

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT registration_number FROM ppdb_submissions WHERE id = ?",
    [id]
  );
  const submission = rows[0];
  if (!submission) return;

  try {
    const res = await fetch(`${KEU_URL}/api/integration/students/deactivate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEU_KEY}`,
      },
      body: JSON.stringify({ registrationNumber: submission.registration_number }),
      signal: AbortSignal.timeout(KEU_TIMEOUT_MS),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(typeof data?.error === "string" ? data.error : `SIM Keuangan menolak deactivate (HTTP ${res.status})`);
    }
    await pool.execute(
      "UPDATE ppdb_submissions SET sync_status = 'pending', sync_warning = ?, sync_error = NULL WHERE id = ?",
      ["Sinkronisasi dibatalkan karena status bukan Diterima. Siswa dinonaktifkan di SIM Keuangan.", id]
    );
    await logSync(id, "deactivate", "success", null);
    await logPpdbActivity({ ppdbId: id, action: "deactivated", note: "Dinonaktifkan di SIM Keuangan.", actor });
  } catch (error) {
    logError(error, "SIM deactivate");
    const message = error instanceof Error ? error.message : "Gagal menonaktifkan siswa di SIM Keuangan";
    await logSync(id, "deactivate", "failed", message.slice(0, 500));
    await logPpdbActivity({ ppdbId: id, action: "sync_failed", note: message.slice(0, 500), actor });
  }
}
