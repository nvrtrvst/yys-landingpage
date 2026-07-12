"use client";

import { useState } from "react";

export function ReactionButton({ postId, initialCount, initialReacted }: { postId: number; initialCount: number; initialReacted: boolean }) {
  const [count, setCount] = useState(initialCount);
  const [reacted, setReacted] = useState(initialReacted);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mading/posts/${postId}/reactions`, { method: "POST" });
      const data = await res.json();
      if (data.error) return;
      setReacted(data.reacted);
      setCount((c) => data.reacted ? c + 1 : c - 1);
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <button onClick={toggle} disabled={loading}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        reacted ? "bg-red-50 text-red-600 border border-red-200" : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
      } disabled:opacity-50`}>
      <span className={reacted ? "text-red-500" : ""}>{reacted ? "❤️" : "🤍"}</span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
