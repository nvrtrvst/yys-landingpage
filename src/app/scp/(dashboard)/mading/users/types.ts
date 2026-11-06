export interface UnitUser {
  id: number;
  name: string;
  email: string;
  role: "guru" | "siswa";
  unit_id: number | null;
  nis: string | null;
  class_name: string | null;
  identity_verified: number;
  created_at: string;
}
