import { NextResponse } from "next/server";
import { ForbiddenError, handleApiError } from "@/lib/errors";
import pool from "@/lib/db";
import { requireModuleOrRoles } from "@/lib/api-auth";
import { z } from "zod";
import { RowDataPacket } from "mysql2";
import { revalidateUnitSites } from "@/lib/revalidate-unit-sites";

const imageUrl = z.string().refine((value) => /^https?:\/\//i.test(value) || value.startsWith("/uploads/"), "URL gambar tidak valid");

const mediaSchema = z.object({
  carousel_images: z.array(imageUrl).max(8),
  youtube_url: z.string().nullable().optional().refine((value) => !value || /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(value), "URL YouTube tidak valid"),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireModuleOrRoles("units", ["superadmin", "admin", "admin_unit"]);
    const id = (await params).id;
    if (session.user.role === "admin_unit") {
      if (!session.user.unit_id || session.user.unit_id !== Number(id)) throw new ForbiddenError("Dilarang");
    }

    const body = await request.json();
    const result = mediaSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    const [existing] = await pool.execute<RowDataPacket[]>("SELECT id FROM units WHERE id = ?", [id]);
    if (existing.length === 0) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    await pool.execute(
      "UPDATE units SET carousel_images = ?, youtube_url = ? WHERE id = ?",
      [JSON.stringify(result.data.carousel_images), result.data.youtube_url?.trim() || null, id]
    );
    await revalidateUnitSites();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
