"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
  unit_id: number | null;
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/mading/siswa/login"); return; }
    if (session?.user.role !== "siswa") { router.push("/mading"); return; }
    if (!params?.id) return;

    const load = async () => {
      try {
        const [catRes, postRes] = await Promise.all([
          fetch("/api/mading/categories"),
          fetch(`/api/mading/posts/${params.id}`),
        ]);
        const catData = await catRes.json();
        setCategories(catData.data || catData || []);

        const post = await postRes.json();
        if (post.error) { setError(post.error); return; }
        if (parseInt(post.author_id) !== parseInt(session!.user.id)) { setError("Bukan tulisanmu."); return; }
        if (!["draft", "revision"].includes(post.status)) { setError("Tulisan sudah tidak bisa diedit."); return; }

        setTitle(post.title);
        setContent(post.content);
        setCategoryId(post.category_id ? String(post.category_id) : "");
        setCoverImage(post.cover_image || null);
      } catch {
        setError("Gagal memuat tulisan.");
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [status, session, params, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/mading/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal upload"); return; }
      setCoverImage(data.url);
    } catch {
      setError("Gagal upload gambar");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/mading/posts/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category_id: categoryId ? parseInt(categoryId) : null,
          cover_image: coverImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menyimpan."); setLoading(false); return; }
      router.push("/mading/siswa/dashboard");
    } catch {
      setError("Kesalahan server. Coba lagi.");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Hapus tulisan ini?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/mading/posts/${params.id}`, { method: "DELETE" });
      if (res.ok) router.push("/mading/siswa/dashboard");
      else setError("Gagal menghapus.");
    } catch {
      setError("Kesalahan server.");
    }
    setLoading(false);
  };

  if (status === "loading" || fetching) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/mading/siswa/dashboard" className="text-sm text-gray-500 hover:text-green-600">&larr; Kembali</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Edit Tulisan</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
            <option value="">Tanpa kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Sampul</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={imageUploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          {imageUploading && <p className="text-xs text-gray-400 mt-1">Mengupload...</p>}
          {coverImage && (
            <div className="mt-2 relative inline-block">
              <img src={coverImage} alt="Cover" className="h-32 rounded-lg object-cover" />
              <button type="button" onClick={() => setCoverImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Konten</label>
          <textarea required value={content} onChange={(e) => setContent(e.target.value)} rows={12}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          <button type="button" onClick={handleDelete} disabled={loading}
            className="px-6 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors">
            Hapus
          </button>
          <Link href="/mading/siswa/dashboard"
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
