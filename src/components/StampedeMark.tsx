export function StampedeMark({ className }: { className?: string }) {
  return (
    <svg
      width="36"
      height="28"
      viewBox="0 0 36 28"
      fill="none"
      aria-hidden
      className={`block ${className ?? ""}`}
    >
      <path
        d="M2 22 L9 6 L16 16 L24 4 L34 20"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="square"
      />
    </svg>
  );
}
