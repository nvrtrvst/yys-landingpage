import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createDraftToken, verifyDraftToken } from "@/lib/ppdb-draft";
import { isPpdbDocType, isPpdbUnit, savePpdbDocument } from "@/lib/ppdb-documents";

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit(`ppdb-upload:${getClientIp(request)}`, 20, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Terlalu banyak unggahan. Coba lagi nanti." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const unitRaw = String(formData.get("unit") || "").toLowerCase();
    const typeRaw = String(formData.get("type") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }
    if (!isPpdbUnit(unitRaw)) {
      return NextResponse.json({ error: "Unit tidak valid." }, { status: 400 });
    }
    if (!isPpdbDocType(typeRaw)) {
      return NextResponse.json({ error: "Jenis dokumen tidak valid." }, { status: 400 });
    }

    let draftId = String(formData.get("draftId") || "");
    let token = String(formData.get("token") || "");

    if (!draftId || !token) {
      const draft = createDraftToken(unitRaw);
      draftId = draft.draftId;
      token = draft.token;
    } else if (!verifyDraftToken(token, draftId, unitRaw)) {
      return NextResponse.json(
        { error: "Sesi upload kedaluwarsa. Muat ulang halaman lalu coba lagi." },
        { status: 403 }
      );
    }

    const saved = await savePpdbDocument(file, { unit: unitRaw, draftId, type: typeRaw });
    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      draftId,
      token,
      type: typeRaw,
      key: saved.key,
      url: saved.url,
    });
  } catch (error) {
    console.error("PPDB document upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah dokumen." }, { status: 500 });
  }
}
