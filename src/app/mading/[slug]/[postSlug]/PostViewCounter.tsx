"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Eye } from "lucide-react";

export function PostViewCounter({ postId, initialViews, authorId }: { postId: number; initialViews: number; authorId: number }) {
  const [views, setViews] = useState(initialViews);
  const counted = useRef(false);
  const { data: session, status } = useSession();
  const isAuthor = !!session?.user && parseInt(session.user.id) === authorId;

  useEffect(() => {
    if (status === "loading" || counted.current || isAuthor) return;
    counted.current = true;
    fetch(`/api/mading/posts/${postId}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => { if (d && typeof d.views === "number") setViews(d.views); })
      .catch(() => {});
  }, [postId, isAuthor, status]);

  return (
    <span className="inline-flex items-center gap-1">
      <Eye className="h-3.5 w-3.5" />
      {views.toLocaleString("id-ID")} dibaca
    </span>
  );
}
