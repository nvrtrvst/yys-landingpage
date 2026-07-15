import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logError, handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    if (!["superadmin", "admin", "admin_unit"].includes(session.user.role))
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    const isAdminUnit = session.user.role === "admin_unit" && session.user.unit_id;
    const unitCondition = isAdminUnit ? "WHERE p.unit_id = ?" : "";
    const unitParams = isAdminUnit ? [session.user.unit_id] : [];

    const [totalPosts] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM mading_posts p ${unitCondition}`,
      unitParams
    );

    const [postsByStatus] = await pool.execute<RowDataPacket[]>(
      `SELECT status, COUNT(*) as count FROM mading_posts p ${unitCondition} GROUP BY status`,
      unitParams
    );

    const [recentPosts] = await pool.execute<RowDataPacket[]>(
      `SELECT p.id, p.title, p.status, p.created_at, u.name as author_name, un.name as unit_name
       FROM mading_posts p JOIN users u ON p.author_id = u.id
       LEFT JOIN units un ON p.unit_id = un.id
       ${unitCondition}
       ORDER BY p.created_at DESC LIMIT 5`,
      unitParams
    );

    const statusMap: Record<string, number> = {};
    for (const row of postsByStatus as RowDataPacket[]) statusMap[row.status as string] = row.count;

    let perUnit: RowDataPacket[] = [];
    const totalUsers = { guru: 0, siswa: 0 };

    if (!isAdminUnit) {
      const [byUnit] = await pool.execute<RowDataPacket[]>(
        `SELECT u.id, u.name, u.slug, u.primary_color,
                COUNT(p.id) as total_posts,
                SUM(p.status = 'pending') as pending,
                SUM(p.status = 'approved') as approved,
                SUM(p.status = 'draft') as draft
         FROM units u
         LEFT JOIN mading_posts p ON p.unit_id = u.id
         WHERE u.status = 'active'
         GROUP BY u.id ORDER BY u.order_index`
      );
      perUnit = byUnit;

      const [userC] = await pool.execute<RowDataPacket[]>(
        "SELECT role, COUNT(*) as count FROM users WHERE role IN ('guru','siswa') GROUP BY role"
      );
      for (const r of userC as RowDataPacket[]) {
        if (r.role === "guru") totalUsers.guru = r.count;
        if (r.role === "siswa") totalUsers.siswa = r.count;
      }
    }

    return NextResponse.json({
      totalPosts: (totalPosts[0] as RowDataPacket).total,
      statusDistribution: statusMap,
      pendingReview: statusMap["pending"] || 0,
      recentPosts,
      perUnit,
      totalUsers: isAdminUnit ? null : totalUsers,
    });
  } catch (error) {
    logError(error, 'Mading Stats');
    return handleApiError(error);
  }
}
