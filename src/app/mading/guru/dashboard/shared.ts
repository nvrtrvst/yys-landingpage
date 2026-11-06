import { Clock, CheckCircle2, FileEdit, XCircle } from "lucide-react";

export interface MadingPost {
  id: number;
  title: string;
  excerpt: string;
  cover_image: string | null;
  category_id: number | null;
  author_id: number;
  unit_id: number | null;
  content?: string;
  status: "draft" | "pending" | "approved" | "rejected" | "revision";
  revision_note: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_name: string;
  category_name: string | null;
  category_slug: string | null;
  unit_slug: string | null;
  slug: string | null;
  views: number;
}

export const TABS = [
  { key: "pending", label: "Menunggu Review", icon: Clock, ring: "from-amber-500 to-orange-500" },
  { key: "approved", label: "Disetujui", icon: CheckCircle2, ring: "from-emerald-500 to-green-600" },
  { key: "revision", label: "Revisi", icon: FileEdit, ring: "from-sky-500 to-blue-600" },
  { key: "rejected", label: "Ditolak", icon: XCircle, ring: "from-rose-500 to-red-600" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];
