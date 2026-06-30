/**
 * Memphis Earth background scatter — fixed SVG layer of decorative shapes
 * floating at low opacity behind all content. Hidden on small screens to
 * keep mobile layouts clean.
 */
export function MemphisScatter() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 hidden md:block overflow-hidden"
      style={{ opacity: 0.18 }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        {/* triangles */}
        <polygon points="60,40 90,95 30,95" fill="hsl(var(--terra))" />
        <polygon points="1240,180 1290,260 1190,260" fill="hsl(var(--forest))" />
        <polygon points="200,720 240,790 160,790" fill="hsl(var(--salmon))" />

        {/* circles */}
        <circle cx="320" cy="160" r="28" fill="hsl(var(--salmon))" />
        <circle cx="1100" cy="540" r="36" fill="hsl(var(--sage))" />
        <circle cx="540" cy="880" r="22" fill="hsl(var(--terra))" />

        {/* squares (rotated) */}
        <rect x="900" y="80" width="44" height="44" fill="hsl(var(--forest))" transform="rotate(15 922 102)" />
        <rect x="80" y="420" width="36" height="36" fill="hsl(var(--terra))" transform="rotate(-12 98 438)" />
        <rect x="1180" y="780" width="40" height="40" fill="hsl(var(--salmon))" transform="rotate(22 1200 800)" />

        {/* plus signs */}
        <g stroke="hsl(var(--forest))" strokeWidth="6" strokeLinecap="square">
          <line x1="700" y1="60" x2="700" y2="110" />
          <line x1="675" y1="85" x2="725" y2="85" />
        </g>
        <g stroke="hsl(var(--terra))" strokeWidth="6" strokeLinecap="square">
          <line x1="430" y1="500" x2="430" y2="540" />
          <line x1="410" y1="520" x2="450" y2="520" />
        </g>

        {/* squiggles */}
        <path
          d="M 820 380 q 20 -25 40 0 t 40 0 t 40 0 t 40 0"
          fill="none"
          stroke="hsl(var(--salmon))"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M 140 240 q 18 -22 36 0 t 36 0 t 36 0"
          fill="none"
          stroke="hsl(var(--sage))"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* diamonds */}
        <polygon points="1020,260 1050,290 1020,320 990,290" fill="hsl(var(--terra))" />
        <polygon points="380,620 410,650 380,680 350,650" fill="hsl(var(--forest))" />
      </svg>
    </div>
  );
}
