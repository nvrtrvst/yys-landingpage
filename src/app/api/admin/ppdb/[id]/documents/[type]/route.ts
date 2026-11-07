import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireModuleOrRoles } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";

const PRIVDOCS: Record<string, { field: "kk_document" | "birth_cert_document" | "diploma_document"; label: string }> = {
  kk: { field: "kk_document", label: "kartu-keluarga" },
  akta: { field: "birth_cert_document", label: "akta-kelahiran" },
  ijazah: { field: "diploma_document", label: "ijazah-skl" },
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  try {
    await requireModuleOrRoles("ppdb_data", ["superadmin", "admin"]);

    const { id: idParam, type: typeParam } = await params;
    const ppdbId = Number(idParam);
    const documentInfo = PRIVDOCS[typeParam];

    if (!Number.isInteger(ppdbId) || ppdbId <= 0 || !documentInfo) {
      return NextResponse.json({ error: "Dokumen tidak valid." }, { status: 400 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT unit, registration_number, ${documentInfo.field} AS document FROM ppdb_submissions WHERE id = ?`,
      [ppdbId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Pendaftar tidak ditemukan." }, { status: 404 });
    }

    const unit = String(rows[0].unit || "").toLowerCase();
    const documentPath = typeof rows[0].document === "string" ? rows[0].document : "";
    const registrationNumber = String(rows[0].registration_number || "ppdb");

    if (!unit || !documentPath.startsWith(`ppdb/${unit}/`)) {
      return NextResponse.json({ error: "Dokumen tidak tersedia." }, { status: 404 });
    }

    const storageRoot = path.resolve(process.cwd(), "storage");
    const resolvedPath = path.resolve(storageRoot, documentPath);

    if (!resolvedPath.startsWith(path.resolve(storageRoot, `ppdb${path.sep}${unit}`) + path.sep)) {
      return NextResponse.json({ error: "Dokumen tidak valid." }, { status: 403 });
    }

    const buffer = await readFile(resolvedPath);
    const extension = path.extname(resolvedPath).toLowerCase();
    const contentType = extension === ".pdf" ? "application/pdf" : "image/webp";
    const disposition = extension === ".pdf"
      ? `attachment; filename="${documentInfo.label}-${registrationNumber}.pdf"`
      : `inline; filename="${documentInfo.label}-${registrationNumber}.webp"`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
