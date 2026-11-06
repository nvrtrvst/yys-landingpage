export const cardClass = "rounded-xl border border-slate-200 bg-white";

export const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100";

export const selectClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100";

export const textareaClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2";

export const btnPrimary = `inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 ${focusRing}`;

export const btnSecondary = `inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 ${focusRing}`;

export const btnGhostDanger = `inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50 ${focusRing}`;

export const thClass = "px-4 py-3 text-xs font-semibold text-slate-500";

export const tdClass = "px-4 py-3 text-sm text-slate-600";

export const badgeBase = "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold";
export const badgeNeutral = `${badgeBase} bg-slate-100 text-slate-600`;
export const badgeSuccess = `${badgeBase} bg-emerald-50 text-emerald-700`;
export const badgeDanger = `${badgeBase} bg-rose-50 text-rose-700`;
export const badgeWarning = `${badgeBase} bg-amber-50 text-amber-700`;
export const badgeInfo = `${badgeBase} bg-sky-50 text-sky-700`;
