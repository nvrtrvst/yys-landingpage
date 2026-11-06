export function SectionMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute text-primary-500 ${className}`}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="15" y="15" width="70" height="70" />
      <rect x="15" y="15" width="70" height="70" transform="rotate(45 50 50)" />
      <circle cx="50" cy="50" r="33" />
    </svg>
  );
}
