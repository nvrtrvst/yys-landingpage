"use client";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
        <p className="text-gray-600 mb-8">Silakan coba lagi atau hubungi administrator.</p>
        <button onClick={reset} className="px-8 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition">
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
