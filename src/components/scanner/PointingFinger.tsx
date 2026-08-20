export function PointingFinger({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 152"
      className={className}
      aria-hidden="true"
    >
      <g fill="currentColor">
        <path d="M30 8h26v108Q43 140 30 116V8z" />
        <circle cx="30" cy="32" r="11" />
        <circle cx="30" cy="54" r="11" />
        <circle cx="30" cy="76" r="11" />
      </g>
    </svg>
  );
}
