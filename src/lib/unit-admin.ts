import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna tidak valid");

export const unitSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  primary_color: hexColor.nullable().optional(),
  secondary_color: hexColor.nullable().optional(),
  tagline: z.string().nullable().optional(),
  history_html: z.string().nullable().optional().transform((value) => value ? DOMPurify.sanitize(value) : null),
  vision: z.string().nullable().optional(),
  mission: z.string().nullable().optional(),
  profile_image: z.string().nullable().optional(),
  stat_students: z.string().nullable().optional(),
  stat_founded: z.string().nullable().optional(),
  hero_background: z.string().nullable().optional(),
  programs_background: z.string().nullable().optional(),
  carousel_images: z.array(z.string()).max(8).nullable().optional(),
  youtube_url: z.string().nullable().optional().refine((value) => !value || /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(value), "URL YouTube tidak valid"),
  order_index: z.number().int().default(0),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  contact_email: z.string().nullable().optional(),
  social_instagram: z.string().nullable().optional(),
  social_facebook: z.string().nullable().optional(),
  social_youtube: z.string().nullable().optional(),
  map_embed_url: z.string().nullable().optional(),
  map_coordinates: z.string().nullable().optional(),
  wa_number: z.string().nullable().optional(),
  wa_message: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type UnitInput = z.infer<typeof unitSchema>;

export const UNIT_COLUMNS = [
  "name", "slug", "description", "content", "image_url", "logo_url", "primary_color", "secondary_color", "tagline",
  "history_html", "vision", "mission", "profile_image", "stat_students", "stat_founded",
  "hero_background", "programs_background", "carousel_images", "youtube_url", "address", "phone", "contact_email",
  "social_instagram", "social_facebook", "social_youtube", "map_embed_url", "map_coordinates",
  "wa_number", "wa_message", "order_index", "status",
] as const;

export const UNIT_SELECT = UNIT_COLUMNS.join(", ");
export const UNIT_INSERT_SQL = `INSERT INTO units (${UNIT_COLUMNS.join(", ")}) VALUES (${UNIT_COLUMNS.map(() => "?").join(", ")})`;
export const UNIT_UPDATE_SQL = `UPDATE units SET ${UNIT_COLUMNS.map((column) => `${column}=?`).join(", ")} WHERE id=?`;

export function unitParams(data: UnitInput): (string | number | null)[] {
  const value = (input: string | null | undefined) => input?.trim() || null;
  const wa = value(data.wa_number);
  return [
    data.name,
    data.slug,
    value(data.description),
    value(data.content),
    value(data.image_url),
    value(data.logo_url),
    value(data.primary_color),
    value(data.secondary_color),
    value(data.tagline),
    value(data.history_html),
    value(data.vision),
    value(data.mission),
    value(data.profile_image),
    value(data.stat_students),
    value(data.stat_founded),
    value(data.hero_background),
    value(data.programs_background),
    data.carousel_images?.length ? JSON.stringify(data.carousel_images) : null,
    value(data.youtube_url),
    value(data.address),
    value(data.phone),
    value(data.contact_email),
    value(data.social_instagram),
    value(data.social_facebook),
    value(data.social_youtube),
    value(data.map_embed_url),
    value(data.map_coordinates),
    wa ? wa.replace(/\D/g, "").slice(0, 20) : null,
    value(data.wa_message),
    data.order_index,
    data.status,
  ];
}
