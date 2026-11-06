"use client";

import { Pencil, Trash2, User } from "lucide-react";
import type { UnitUser } from "./types";

export function UsersTable({
  loading,
  users,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  users: UnitUser[];
  onEdit: (user: UnitUser) => void;
  onDelete: (user: UnitUser) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">NIS</th>
            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelas</th>
            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Verif</th>
            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bergabung</th>
            <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="p-4"><div className="h-5 w-32 bg-slate-100 rounded animate-pulse" /></td>
                <td className="p-4"><div className="h-5 w-48 bg-slate-100 rounded animate-pulse" /></td>
                <td className="p-4"><div className="h-5 w-24 bg-slate-100 rounded animate-pulse" /></td>
                <td className="p-4"><div className="h-5 w-20 bg-slate-100 rounded animate-pulse" /></td>
                <td className="p-4"><div className="h-5 w-16 bg-slate-100 rounded animate-pulse" /></td>
                <td className="p-4"><div className="h-5 w-12 bg-slate-100 rounded animate-pulse" /></td>
                <td className="p-4"><div className="h-5 w-24 bg-slate-100 rounded animate-pulse" /></td>
                <td className="p-4"><div className="h-5 w-16 bg-slate-100 rounded animate-pulse ml-auto" /></td>
              </tr>
            ))
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-12 text-center">
                <div className="text-slate-300 mb-2"><User className="h-10 w-10 mx-auto" /></div>
                <p className="text-slate-500 font-medium">Belum ada user</p>
                <p className="text-slate-400 text-sm mt-1">Tambahkan user guru atau siswa untuk mulai</p>
              </td>
            </tr>
          ) : users.map((user) => (
            <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${user.role === "guru" ? "bg-sky-500" : "bg-primary-500"}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-900 text-sm">{user.name}</span>
                </div>
              </td>
              <td className="p-4 text-sm text-slate-600">{user.email}</td>
              <td className="p-4 text-sm text-slate-600 font-mono">{user.nis || "-"}</td>
              <td className="p-4 text-sm text-slate-600">{user.class_name || "-"}</td>
              <td className="p-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === "guru"
                    ? "bg-sky-50 text-sky-700 ring-1 ring-blue-700/10"
                    : "bg-emerald-50 text-emerald-700 ring-1 ring-green-700/10"
                }`}>
                  {user.role === "guru" ? "Guru" : "Siswa"}
                </span>
              </td>
              <td className="p-4">
                {user.identity_verified ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/10">
                    Terverifikasi
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                    Belum
                  </span>
                )}
              </td>
              <td className="p-4 text-sm text-slate-500">
                {new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onEdit(user)}
                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                    title="Edit user">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(user)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus user">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
