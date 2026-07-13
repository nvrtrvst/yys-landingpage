"use client";

import { toast } from "sonner";

export function NotifItem({ id, message, createdAt, isRead }: { id: number; message: string; createdAt: string; isRead: boolean }) {
  const handleClick = async () => {
    if (isRead) return;
    try {
      await fetch(`/api/mading/notifications/${id}`, { method: "PATCH" });
    } catch { toast.error("Gagal update"); }
  };

  return (
    <div onClick={handleClick} className={`p-3 rounded-lg text-sm border cursor-pointer transition-colors ${
      isRead ? "bg-white border-gray-200 text-gray-600" : "bg-green-50 border-green-200 text-green-800 font-medium"
    }`}>
      <p>{message}</p>
      <p className="text-xs mt-1 opacity-60">{new Date(createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
    </div>
  );
}
