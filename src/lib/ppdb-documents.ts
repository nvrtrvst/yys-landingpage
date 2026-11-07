import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

export const PPDB_UNITS = ["lpq", "tk", "sd", "smp", "smk"] as const;
export type PpdbUnit = (typeof PPDB_UNITS)[number];
export type PpdbDocType = "photo" | "kk" | "akta" | "ijazah";

const DOC_CONFIG: Record<
  PpdbDocType,
  { maxSizeMB: number; allowedTypes: string[]; private: boolean }
> = {
  photo: { maxSizeMB: 1, allowedTypes: ["image/jpeg", "image/png", "image/webp"], private: false },
  kk: { maxSizeMB: 2, allowedTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"], private: true },
  akta: { maxSizeMB: 2, allowedTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"], private: true },
  ijazah: { maxSizeMB: 2, allowedTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"], private: true },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPpdbUnit(value: string): value is PpdbUnit {
  return (PPDB_UNITS as readonly string[]).includes(value);
}

export function isPpdbDocType(value: string): value is PpdbDocType {
  return value === "photo" || value === "kk" || value === "akta" || value === "ijazah";
}

export function isValidDraftId(value: string): boolean {
  return UUID_RE.test(value);
}

function checkMagic(buffer: Buffer, type: string): boolean {
  if (type === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === "image/png") return buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  if (type === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    );
  }
  if (type === "application/pdf") return buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  return false;
}

export async function savePpdbDocument(
  file: File,
  input: { unit: PpdbUnit; draftId: string; type: PpdbDocType }
): Promise<{ ok: true; key: string; url?: string } | { ok: false; error: string }> {
  const config = DOC_CONFIG[input.type];

  if (!isValidDraftId(input.draftId)) {
    return { ok: false, error: "Sesi upload tidak valid." };
  }
  if (!config.allowedTypes.includes(file.type)) {
    return { ok: false, error: "Format file tidak didukung." };
  }
  if (file.size > config.maxSizeMB * 1024 * 1024) {
    return { ok: false, error: `Ukuran file melebihi ${config.maxSizeMB}MB.` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!checkMagic(buffer, file.type)) {
    return { ok: false, error: "File tidak sesuai dengan formatnya." };
  }

  const directory = `ppdb/${input.unit}/${input.draftId}`;
  const baseDir = config.private
    ? path.join(process.cwd(), "storage")
    : path.join(process.cwd(), "public", "uploads");
  const uploadDir = path.join(baseDir, directory);
  await mkdir(uploadDir, { recursive: true });

  const isPdf = file.type === "application/pdf";
  const extension = isPdf ? "pdf" : "webp";
  const filename = `${input.type}-${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(uploadDir, filename);

  if (isPdf) {
    await writeFile(filePath, buffer);
  } else {
    const webp = await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await writeFile(filePath, webp);
  }

  if (config.private) {
    return { ok: true, key: `${directory}/${filename}` };
  }
  return { ok: true, key: `${directory}/${filename}`, url: `/uploads/${directory}/${filename}` };
}
