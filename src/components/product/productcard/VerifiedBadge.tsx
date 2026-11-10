// components/product/productcard/VerifiedBadge.tsx
// SERVER COMPONENT safe: pure SVG, no hooks, no client JS, no gradient ids
// (so it's safe to render 100s of times on one page without duplicate-id issues)

type VerifiedBadgeProps = {
  /** Text shown next to the seal (from the `sm` breakpoint up) */
  label?: string;
  /** Hide the text label at every screen size (seal only) */
  iconOnly?: boolean;
  className?: string;
};

// Builds a smooth scalloped "seal" outline (like a rosette) once at module load
function buildSealPath(
  cx: number,
  cy: number,
  radius: number,
  amplitude: number,
  lobes: number,
  steps = 96
) {
  const pts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const theta = (2 * Math.PI * i) / steps;
    const r = radius + amplitude * Math.cos(lobes * theta);
    const x = (cx + r * Math.cos(theta)).toFixed(2);
    const y = (cy + r * Math.sin(theta)).toFixed(2);
    pts.push(`${i === 0 ? "M" : "L"}${x} ${y}`);
  }
  return `${pts.join(" ")} Z`;
}

const SEAL_PATH = buildSealPath(12, 12, 10.2, 0.9, 10);

export function VerifiedBadge({
  label = "Verified",
  iconOnly = false,
  className = "",
}: VerifiedBadgeProps) {
  return (
    <span
      role="img"
      aria-label="Verified seller"
      title="Verified seller"
      className={`inline-flex shrink-0 items-center select-none ${className}`}
    >
      {/* Seal */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="relative z-10 h-5 w-5 sm:h-6 sm:w-6 drop-shadow-[0_1px_1.5px_rgba(13,148,136,0.45)]"
      >
        {/* Scalloped outer seal */}
        <path d={SEAL_PATH} fill="#0d9488" stroke="#0f766e" strokeWidth="0.5" />
        {/* Inner disc + thin white ring */}
        <circle cx="12" cy="12" r="7.6" fill="#14b8a6" />
        <circle
          cx="12"
          cy="12"
          r="7.6"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="0.7"
        />
        {/* Gloss highlight */}
        <path
          d="M5.9 8.6 A7.4 7.4 0 0 1 10.6 4.7"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.7"
          strokeWidth="1"
          strokeLinecap="round"
        />
        {/* Check mark */}
        <path
          d="M8 12.4 L10.9 15.2 L16.2 9.2"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Ribbon label — hidden on very small screens so the store name keeps its space */}
      {!iconOnly && (
        <span className="-ml-2.5 hidden h-5 items-center rounded-r-full border border-teal-200 bg-teal-50 pl-3.5 pr-2.5 text-[11px] font-semibold leading-none text-teal-700 sm:inline-flex">
          {label}
        </span>
      )}
    </span>
  );
}