import { useEffect, useState } from "react";

// Flag "sudah mount di client". SSR merender false, berubah true setelah mount.
// Dipusatkan di sini agar pola mounted hanya butuh satu pengecualian lint.
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  return mounted;
}
