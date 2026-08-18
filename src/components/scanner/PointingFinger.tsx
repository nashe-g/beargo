export function PointingFinger({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 120"
      fill="currentColor"
      aria-hidden="true"
    >
      <ellipse cx="14" cy="38" rx="11" ry="18" transform="rotate(-28 14 38)" />
      <ellipse cx="38" cy="34" rx="22" ry="26" />
      <rect x="27" y="46" width="22" height="64" rx="11" />
    </svg>
  );
}
