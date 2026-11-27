export function safeUnitColor(value: string | null | undefined, fallback: string): string {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : fallback;
}

export const unitSiteStyles = `
.unit-site { color: #24392c; background: #fffdf8; }
.unit-site a { text-decoration: none; }
.unit-site :focus-visible { outline: 3px solid var(--unit-secondary); outline-offset: 3px; border-radius: 4px; }
.unit-site img { max-width: 100%; }
.unit-site-header { position: sticky; top: 0; z-index: 20; background: var(--unit-primary); color: var(--unit-on-primary); }
.unit-site-header-inner { max-width: 1200px; margin: 0 auto; padding: max(10px, env(safe-area-inset-top)) 20px 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.unit-site-nav { display: none; }
.unit-site-nav a { color: var(--unit-on-primary); min-height: 44px; display: inline-flex; align-items: center; }
.unit-site-nav-mobile { position: relative; }
.unit-site-menu-button { min-height: 44px; display: inline-flex; align-items: center; padding: 0 18px; border-radius: 10px; background: var(--unit-secondary); color: var(--unit-ink); font-weight: 700; cursor: pointer; list-style: none; }
.unit-site-menu-button::-webkit-details-marker { display: none; }
.unit-site-menu { position: absolute; right: 0; top: calc(100% + 8px); background: var(--unit-primary); padding: 16px; min-width: 220px; display: flex; flex-direction: column; gap: 4px; border-radius: 12px; box-shadow: 0 18px 40px rgba(0,0,0,0.25); }
.unit-site-menu a { min-height: 44px; display: flex; align-items: center; color: var(--unit-on-primary); padding: 0 8px; border-radius: 8px; }
.unit-site-menu a:hover, .unit-site-menu a:focus-visible { background: rgba(255,255,255,0.12); }
.unit-site-menu .unit-site-cta { margin-top: 8px; justify-content: center; }
.unit-site-menu-overlay { position: fixed; inset: 0; z-index: 15; background: transparent; border: 0; padding: 0; cursor: default; }
.unit-site-cta { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; border-radius: 10px; background: var(--unit-secondary); color: var(--unit-ink); font-weight: 700; }
.unit-site-cta-outline { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; border: 1px solid var(--unit-primary); border-radius: 10px; color: var(--unit-primary); font-weight: 700; background: #fff; }
.unit-site-cta-outline--hero { color: var(--unit-on-primary); border-color: var(--unit-on-primary); background: transparent; }
.unit-site-cta-outline--hero:hover { background: rgba(127,127,127,0.18); }
.unit-site-section { padding: 44px 20px; scroll-margin-top: 76px; }
.unit-site-container { max-width: 1200px; margin: 0 auto; width: 100%; }
.unit-site-hero { padding: 48px 20px; position: relative; overflow: hidden; background: var(--unit-primary); color: var(--unit-on-primary); scroll-margin-top: 76px; }
.unit-site-hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.12; }
.unit-site-hero-inner { position: relative; max-width: 1200px; margin: 0 auto; }
.unit-site-h2 { font-size: clamp(1.4rem, 4vw, 1.9rem); color: var(--unit-primary); margin: 0 0 20px; }
.unit-site-h3 { font-size: 1.15rem; margin: 0 0 12px; }
.unit-site-wave-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 20px; }
.unit-site-wave-chip { background: #fff; border: 1px solid #e2e8e2; border-radius: 999px; padding: 6px 14px; font-size: 13px; color: #24392c; }
.unit-site-wave-chip strong { color: var(--unit-primary); }
.unit-site-ppdb-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; }
.unit-site-schedule { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8e2; border-radius: 12px; overflow: hidden; }
.unit-site-schedule th, .unit-site-schedule td { padding: 10px 12px; text-align: left; font-size: 14px; border-bottom: 1px solid #eef2ee; }
.unit-site-schedule thead th { background: #eef4ee; color: #24392c; font-size: 13px; }
.unit-site-schedule tbody tr:last-child td { border-bottom: 0; }
.unit-site-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.unit-site-steps li { display: flex; gap: 12px; align-items: flex-start; line-height: 1.5; }
.unit-site-step-no { flex: 0 0 28px; width: 28px; height: 28px; border-radius: 50%; background: var(--unit-primary); color: var(--unit-on-primary); display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
.unit-site-ppdb-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
.unit-site-sticky { position: fixed; left: 0; right: 0; bottom: 0; z-index: 25; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); background: var(--unit-primary); display: flex; }
.unit-site-sticky .unit-site-cta { width: 100%; }
.unit-site-sticky .unit-site-cta { background: var(--unit-secondary); color: var(--unit-ink); }
.unit-site-card { background: #fff; border: 1px solid #e2e8e2; border-radius: 14px; padding: 16px; }
.unit-site-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; }
.unit-site-gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap: 16px; }
.unit-site-profil h2 { font-size: clamp(1.4rem, 4vw, 1.9rem); color: var(--unit-primary); margin: 0 0 16px; }
.unit-site-profil h3 { font-size: 1.15rem; margin: 24px 0 8px; }
.unit-site-profil p, .unit-site-profil li { line-height: 1.7; color: #4a5a4f; }
.unit-site-profil ul, .unit-site-profil ol { padding-left: 20px; }
.unit-site-profil img { max-width: 100%; height: auto; }
.unit-site-answer { overflow-wrap: anywhere; }
.unit-site-faq details { border: 1px solid #e2e8e2; border-radius: 12px; background: #fff; margin-bottom: 10px; }
.unit-site-faq summary { min-height: 44px; padding: 12px 16px; cursor: pointer; font-weight: 700; }
.unit-site-faq h3 { font-family: var(--font-baloo), sans-serif; font-size: 1.15rem; color: var(--unit-primary); margin: 24px 0 12px; }
.unit-site-faq .unit-site-faq-answer { padding: 0 16px 16px; line-height: 1.7; color: #4a5a4f; }
.unit-site-carousel-viewport { overflow: hidden; border-radius: 14px; }
.unit-site-carousel-track { display: flex; transition: transform 220ms ease; }
.unit-site-carousel-slide { flex: 0 0 100%; min-width: 0; }
.unit-site-carousel-controls { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
.unit-site-carousel-button { min-width: 44px; min-height: 44px; padding: 8px 14px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--unit-primary); border-radius: 10px; background: #fff; color: var(--unit-primary); font-weight: 700; cursor: pointer; }
.unit-site-carousel-slide img { display: block; width: 100%; height: min(58vw, 360px); object-fit: contain; background: #e8efe8; }
.unit-site-carousel-button[aria-current="true"] { background: var(--unit-secondary); color: var(--unit-ink); border-color: var(--unit-ink); }
.unit-site-video, .unit-site-map-video { aspect-ratio: 16 / 9; width: 100%; border-radius: 14px; overflow: hidden; background: #e8efe8; }
.unit-site-video iframe, .unit-site-map-video iframe { width: 100%; height: 100%; border: 0; }
.unit-site-legal { display: flex; flex-wrap: wrap; gap: 12px; }
.unit-site-legal a { min-height: 44px; display: inline-flex; align-items: center; color: var(--unit-secondary); font-weight: 700; }
.unit-site-wa { position: fixed; right: 20px; bottom: calc(20px + env(safe-area-inset-bottom)); min-width: 48px; min-height: 48px; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--unit-primary); color: var(--unit-on-primary); font-weight: 700; z-index: 30; }
.unit-site-footer { background: #173d27; color: #e4f3e7; padding: 28px 20px calc(28px + env(safe-area-inset-bottom)); }
.unit-site-footer a { color: var(--unit-secondary); }
body:has(.unit-site) [data-global-whatsapp] { display: none !important; }
@media (min-width: 760px) {
  .unit-site-section { padding: 56px 48px; }
  .unit-site-hero { padding: 64px 48px; }
  .unit-site-hero-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: 56px; align-items: center; }
  .unit-site-grid-2 { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 48px; }
  .unit-site-h2 { font-size: 1.9rem; }
  .unit-site-ppdb-grid { grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.6fr); gap: 32px; align-items: start; }
  .unit-site-sticky { display: none; }
  .unit-site-media-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.7fr); gap: 32px; align-items: start; }
  .unit-site-footer { padding: 36px 48px; }
}
@media (max-width: 759px) {
  .unit-site { padding-bottom: 68px; }
  .unit-site-hero-bg { display: none; }
  .unit-site-wa { bottom: calc(84px + env(safe-area-inset-bottom)); }
  .unit-site-schedule thead { display: none; }
  .unit-site-schedule tbody tr { display: block; border-bottom: 1px solid #eef2ee; padding: 6px 0; }
  .unit-site-schedule tbody tr:last-child { border-bottom: 0; }
  .unit-site-schedule td { display: flex; justify-content: space-between; gap: 12px; border-bottom: 0; }
  .unit-site-schedule td::before { content: attr(data-label); font-weight: 700; color: #66756b; }
}
@media (min-width: 1024px) {
  .unit-site-header-inner { padding: 14px 48px; }
  .unit-site-nav { display: flex; align-items: center; gap: 20px; font-weight: 600; font-size: 14px; }
  .unit-site-nav-mobile { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .unit-site-carousel-track { transition: none; }
}
`;
