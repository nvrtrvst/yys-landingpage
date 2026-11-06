import pool from "@/lib/db";
import { logError } from "@/lib/errors";
import type { Session } from "next-auth";

export interface PpdBActor {
  id: number | null;
  name: string;
  role: string | null;
}

export const PUBLIC_ACTOR: PpdBActor = {
  id: null,
  name: "Pendaftar (publik)",
  role: null,
};

export const SYSTEM_ACTOR: PpdBActor = {
  id: null,
  name: "Sistem",
  role: null,
};

export function actorFromSession(session: Session | null): PpdBActor {
  const user = session?.user;
  const id = user?.id ? Number(user.id) : null;
  return {
    id: id && Number.isInteger(id) ? id : null,
    name: user?.name || user?.email || "Sistem",
    role: user?.role || null,
  };
}

function clip(value: string | null | undefined, length: number): string | null {
  if (!value) return null;
  return value.length > length ? value.slice(0, length) : value;
}

export async function logPpdbActivity(input: {
  ppdbId: number;
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  note?: string | null;
  actor: PpdBActor;
}): Promise<void> {
  try {
    await pool.execute(
      `INSERT INTO ppdb_activity_logs
        (ppdb_id, action, field, old_value, new_value, note, actor_id, actor_name, actor_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.ppdbId,
        clip(input.action, 50),
        clip(input.field, 50),
        clip(input.oldValue, 255),
        clip(input.newValue, 255),
        input.note ?? null,
        input.actor.id,
        clip(input.actor.name, 255) ?? "Sistem",
        clip(input.actor.role, 50),
      ]
    );
    await pool.execute(
      "UPDATE ppdb_submissions SET updated_at = NOW(), updated_by_name = ?, last_action = ? WHERE id = ?",
      [clip(input.actor.name, 255) ?? "Sistem", clip(input.action, 50), input.ppdbId]
    );
  } catch (error) {
    logError(error, "PPDB activity log");
  }
}

export const ACTIVITY_LABELS: Record<string, string> = {
  created: "Pendaftaran baru",
  status_changed: "Ubah status",
  printed: "Cetak kartu",
  print_reset: "Batalkan tanda cetak",
  card_emailed: "Kirim kartu via email",
  sync_auto: "Sinkronisasi otomatis",
  sync_manual: "Sinkronisasi manual",
  sync_failed: "Sinkronisasi gagal",
  deactivated: "Nonaktifkan di SIM",
};

export function activityLabel(action: string): string {
  return ACTIVITY_LABELS[action] ?? action;
}
