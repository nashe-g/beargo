export function PointingFinger({ className = "" }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      👇
    </span>
  );
}
