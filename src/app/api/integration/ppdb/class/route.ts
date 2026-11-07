import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const itemSchema = z.object({
  registrationNumber: z.string().min(1).max(50),
  classId: z.string().max(64).nullable(),
  className: z.string().max(100).nullable(),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(100),
});

function isAuthorized(request: Request): boolean {
  const expected = process.env.CMS_WEBHOOK_SECRET || process.env.KEUANGAN_INTEGRATION_KEY;
  const received = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const limit = checkRateLimit(`ppdb-class-webhook:${getClientIp(request)}`, 120, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    let updated = 0;
    let skipped = 0;
    try {
      await connection.beginTransaction();
      for (const item of parsed.data.items) {
        const registrationNumber = item.registrationNumber.trim();
        if (!registrationNumber) {
          skipped++;
          continue;
        }

        const [rows] = await connection.execute<RowDataPacket[]>(
          "SELECT id, sync_class_name FROM ppdb_submissions WHERE registration_number = ? LIMIT 1",
          [registrationNumber]
        );
        const submission = rows[0];
        if (!submission) {
          skipped++;
          continue;
        }

        const oldClassName = typeof submission.sync_class_name === "string" ? submission.sync_class_name : null;
        const newClassName = item.className?.trim() || null;
        const newClassId = item.classId?.trim() || null;

        await connection.execute(
          `UPDATE ppdb_submissions
           SET sync_class_id = ?, sync_class_name = ?,
               sync_warning = CASE
                 WHEN ? IS NOT NULL AND sync_warning LIKE '%Kelas belum ditentukan%' THEN NULL
                 WHEN ? IS NULL THEN 'Kelas belum ditentukan: pilih kelas manual.'
                 ELSE sync_warning
               END,
               updated_at = NOW(),
               last_action = 'class_synced'
           WHERE registration_number = ?`,
          [newClassId, newClassName, newClassName, newClassId, registrationNumber]
        );

        if (oldClassName !== newClassName) {
          await connection.execute(
            `INSERT INTO ppdb_activity_logs
              (ppdb_id, action, field, old_value, new_value, actor_id, actor_name, actor_role)
             VALUES (?, 'class_synced', 'sync_class_name', ?, ?, NULL, 'SIM Keuangan', 'system')`,
            [submission.id, oldClassName, newClassName]
          );
        }

        updated++;
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return NextResponse.json({ success: true, updated, skipped });
  } catch (error) {
    console.error("PPDB class webhook error:", error);
    return NextResponse.json({ error: "Gagal memperbarui kelas." }, { status: 500 });
  }
}
