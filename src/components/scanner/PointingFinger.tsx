export function PointingFinger({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 108"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="40" cy="98" rx="16" ry="6" fill="currentColor" opacity="0.22" />
      <path
        d="M18 22c0-9 6-16 14-16 4 0 7 1.5 9 4 1.5-3.5 5-6 9.5-6 8 0 13 6.5 13 15 0 4-1 8-3 12l-8 32c-.8 3.2-3.6 5.5-7 5.5s-6.2-2.3-7-5.5L30 37c-5-8-12-10-12-15z"
        fill="currentColor"
      />
      <path
        d="M32.5 8.5c-6.5 0-11.5 5.2-11.5 13 0 3.6 2.6 6.8 7.5 14.2l7.6 24.2c.4 1.4 1.7 2.4 3.2 2.4s2.8-1 3.2-2.4l7.6-24.2C54.9 28.3 57.5 25.1 57.5 21.5c0-6.8-4.2-12-10.5-12-2.8 0-5.3 1.4-7 3.6-1.7-2.2-4.4-3.6-7.5-3.6z"
        fill="#f4e4c8"
        opacity="0.22"
      />
      <circle cx="27" cy="20" r="3.2" fill="#1a120b" opacity="0.18" />
      <circle cx="40" cy="16" r="3.6" fill="#1a120b" opacity="0.18" />
      <circle cx="53" cy="20" r="3.2" fill="#1a120b" opacity="0.18" />
      <path
        d="M36 54c1.2 16 2 30 4 38 2-8 2.8-22 4-38"
        fill="none"
        stroke="#1a120b"
        strokeOpacity="0.2"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
