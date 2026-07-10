"use client";

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-black text-red-500 mb-4">Oops!</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
        <p className="text-gray-600 mb-8">Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.</p>
        <button onClick={reset} className="px-8 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition">
          Coba Lagi
        </button>
      </div>
    </main>
  );
}
