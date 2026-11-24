"use client";

import { useEffect, useState } from "react";

export function UnitMobileMenu({ items, ctaHref }: { items: { label: string; href: string }[]; ctaHref: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="unit-site-nav-mobile">
      <button
        type="button"
        className="unit-site-menu-button"
        aria-expanded={open}
        aria-controls="unit-site-menu-panel"
        onClick={() => setOpen((value) => !value)}
      >
        Menu
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="unit-site-menu-overlay"
            aria-label="Tutup menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <nav id="unit-site-menu-panel" className="unit-site-menu" aria-label="Navigasi unit">
            {items.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</a>
            ))}
            <a href={ctaHref} className="unit-site-cta" onClick={() => setOpen(false)}>Daftar PPDB</a>
          </nav>
        </>
      ) : null}
    </div>
  );
}