import { NextResponse } from "next/server";
import { z } from "zod";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { sendPPDBSingleEmail } from "@/lib/mailer";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Validation Schema
const ppdbSchema = z.object({
  unit: z.enum(["LPQ", "TK", "SD", "SMP", "SMK"]),
  grade: z.string().min(1, "Kelas harus diisi").max(50),
  major: z.string().max(100).optional(),
  student_name: z.string().min(3, "Nama minimal 3 karakter").max(150),
  nisn: z.string().max(20).optional(),
  birth_place: z.string().min(3, "Tempat lahir wajib diisi").max(100),
  birth_date: z.string().min(1, "Tanggal lahir wajib diisi").max(20),
  nik: z.string().max(20).optional(),
  religion: z.string().max(50).optional(),
  gender: z.enum(["Laki-laki", "Perempuan"]),
  address: z.string().min(10, "Alamat terlalu pendek").max(500),
  child_order: z.number().int().min(1).max(20).optional(),
  siblings_count: z.number().int().min(0).max(50).optional(),
  previous_school: z.string().max(200).optional(),
  is_pip: z.enum(["YA", "TIDAK"]).optional(),
  father_name: z.string().min(3, "Nama ayah wajib diisi").max(150),
  father_job: z.string().max(100).optional(),
  mother_name: z.string().min(3, "Nama ibu wajib diisi").max(150),
  mother_job: z.string().max(100).optional(),
  guardian_name: z.string().max(150).optional(),
  guardian_job: z.string().max(100).optional(),
  phone: z.string().min(10, "Nomor HP tidak valid").max(20),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid").max(255),
});

export async function POST(req: Request) {
  try {
    // Basic Rate Limiting
    const rl = checkRateLimit(`ppdb:${getClientIp(req)}`, 3, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, message: "Terlalu banyak permintaan. Silakan coba lagi nanti." }, { status: 429 });
    }

    const body = await req.json();
    
    // Validate input
    const parsed = ppdbSchema.parse(body);

    // Generate unique registration number (e.g. PPDB-2024-SD-0001)
    const year = new Date().getFullYear();
    const prefix = `PPDB-${year}-${parsed.unit}-`;
    
    // Create connection to handle transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // --- Race-condition-safe sequence generation ---
      // Using MAX() instead of COUNT() avoids the TOCTOU (Time-of-Check to Time-of-Use) race:
      //   COUNT-based: Two concurrent requests both read count=5, both try to create #6 → DUPLICATE.
      //   MAX-based + FOR UPDATE: The first request locks the row; the second waits, then reads the
      //   updated MAX, so they correctly generate #6 and #7 sequentially.
      const [seqRows] = await connection.execute<RowDataPacket[]>(
        `SELECT MAX(CAST(SUBSTRING_INDEX(registration_number, '-', -1) AS UNSIGNED)) as maxSeq
         FROM ppdb_submissions
         WHERE unit = ? AND YEAR(created_at) = ?
         FOR UPDATE`,
        [parsed.unit, year]
      );
      
      const maxSeq = seqRows[0]?.maxSeq ?? 0;
      const seq = (maxSeq + 1).toString().padStart(4, '0');
      const registration_number = `${prefix}${seq}`;

      // Insert into local database
      await connection.execute(
        `INSERT INTO ppdb_submissions (
          registration_number, unit, grade, major, student_name, nisn, nik, 
          birth_place, birth_date, gender, religion, address, child_order, siblings_count, 
          previous_school, is_pip, father_name, father_job, mother_name, mother_job, 
          guardian_name, guardian_job, phone, email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          registration_number, parsed.unit, parsed.grade, parsed.major || null, 
          parsed.student_name, parsed.nisn || null, parsed.nik || null, parsed.birth_place, parsed.birth_date, 
          parsed.gender, parsed.religion || null, parsed.address, parsed.child_order || null, parsed.siblings_count || null, 
          parsed.previous_school || null, parsed.is_pip || 'TIDAK', parsed.father_name, parsed.father_job || null, 
          parsed.mother_name, parsed.mother_job || null, parsed.guardian_name || null, 
          parsed.guardian_job || null, parsed.phone, parsed.email || null
        ]
      );

      await connection.commit();

      // SIMULATION: Send to external SIM API if enabled
      if (process.env.ENABLE_EXTERNAL_SIM_SYNC === "true" && process.env.NEXT_PUBLIC_EXTERNAL_SIM_API_URL) {
        try {
          const extRes = await fetch(process.env.NEXT_PUBLIC_EXTERNAL_SIM_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registration_number, ...parsed })
          });
          if (!extRes.ok) {
            console.warn("External SIM API sync failed:", await extRes.text());
            // We DO NOT rollback the local transaction if external fails, as per prompt requirement.
          }
        } catch (simError) {
          console.warn("External SIM API unreachable:", simError);
        }
      }

      // Send email asynchronously if email is provided
      if (parsed.email) {
        sendPPDBSingleEmail({
          to: parsed.email,
          registration_number,
          student_name: parsed.student_name,
          unit: parsed.unit,
          grade: parsed.grade
        }).catch(err => console.error("Failed sending email:", err));
      }

      return NextResponse.json({ success: true, registration_number });
    } catch (dbError) {
      await connection.rollback();
      throw dbError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("PPDB API Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Validasi gagal", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Terjadi kesalahan internal" }, { status: 500 });
  }
}
