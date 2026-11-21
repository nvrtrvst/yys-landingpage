export function safeUnitColor(value: string | null | undefined, fallback: string): string {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : fallback;
}

export const unitSiteStyles = `
.unit-site a { text-decoration: none; }
.unit-site-header-inner { max-width: 1200px; margin: 0 auto; padding: 14px 48px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.unit-site-nav-mobile { display: none; }
.unit-site-gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.unit-site-profil h2 { font-family: var(--font-baloo), sans-serif; font-size: 1.75rem; color: var(--unit-primary); margin: 0 0 16px; }
.unit-site-profil h3 { font-family: var(--font-baloo), sans-serif; font-size: 1.25rem; margin: 24px 0 8px; }
.unit-site-profil p { line-height: 1.7; color: #4a5a4f; }
.unit-site-profil ul, .unit-site-profil ol { line-height: 1.7; color: #4a5a4f; padding-left: 20px; }
@media (max-width: 820px) {
  .unit-site-nav { display: none !important; }
  .unit-site-nav-mobile { display: block !important; }
  .unit-site-header-inner { padding: 14px 20px; }
  #beranda, #galeri, #profil, #berita, #agenda { padding-left: 20px !important; padding-right: 20px !important; }
}
`;
