"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [siteKey, setSiteKey] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/public/recaptcha-site")
      .then((res) => res.json())
      .then((data) => setSiteKey(data.siteKey || ""))
      .catch(() => setSiteKey(""));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (siteKey) {
      const token = (window as any).grecaptcha?.getResponse();
      if (!token) {
        setError("Silakan verifikasi bahwa Anda bukan robot.");
        setLoading(false);
        return;
      }
      const res = await signIn("credentials", {
        email,
        password,
        recaptcha: token,
        redirect: false,
      });
      if (res?.error) {
        setError("Email atau password salah.");
        (window as any).grecaptcha?.reset();
        setLoading(false);
      } else {
        router.push("/scp");
      }
    } else {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Email atau password salah.");
        setLoading(false);
      } else {
        router.push("/scp");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {siteKey && (
        <Script
          src="https://www.google.com/recaptcha/api.js"
          onLoad={() => setScriptLoaded(true)}
          strategy="afterInteractive"
        />
      )}
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Login Admin</h2>
          <p className="text-gray-600 mt-2">Yayasan Nuurul Muttaqiin</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="admin@yayasan.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              autoComplete="current-password"
            />
          </div>

          {siteKey && scriptLoaded && (
            <div className="flex justify-center">
              <div className="g-recaptcha" data-sitekey={siteKey} />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
