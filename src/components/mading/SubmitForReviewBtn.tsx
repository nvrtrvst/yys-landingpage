"use client";
import { useState } from "react";
import { toast } from "sonner";

export function SubmitForReviewBtn({ postId }: { postId: number }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mading/posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal"); return; }
      toast.success("Terkirim untuk review!");
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error("Kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleSubmit} disabled={loading}
      className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
    >
      {loading ? "..." : "Kirim untuk Review"}
    </button>
  );
}
