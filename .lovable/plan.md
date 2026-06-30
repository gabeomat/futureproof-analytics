## Memphis Earth Edit — Visual Refresh

Goal: re-skin Futureproof Analytics in the Memphis Earth Edit style you shared. Pure presentation layer — no changes to Supabase queries, edge functions, form logic, calculations, or component hierarchy. Same buttons, same tabs, same numbers, just a totally different visual language.

Adapted from your reference (which was for a marketing-style site) to fit a data dashboard: we keep the Memphis vocabulary — hard offset shadows, 3px ink borders, scattered shapes, pattern fills, Bebas/Space Mono/DM Sans — but apply it restrained enough that financial tables stay readable. No marquee, no shape-spawning playground, no animated demo section — those don't belong in a working dashboard.

### 1. Design tokens (`src/index.css` + `tailwind.config.ts`)
Replace the current dark-teal HSL tokens with the Memphis Earth palette as HSL CSS variables:
- `--salmon` `#f47c70`, `--forest` `#1f3d3a`, `--terra` `#c75a34`, `--sage` `#a8b8a5`, `--cream` `#f8f5ef`, `--linen` `#e8d8c5`, `--ink` `#2b2926`
- Remap shadcn semantic tokens: `--background` → cream, `--foreground` → ink, `--card` → cream, `--primary` → forest, `--secondary` → linen, `--accent` → salmon, `--destructive` → terra, `--muted` → linen, `--border` → ink.
- Add `--shadow-memphis: 4px 4px 0 hsl(var(--ink))` and a smaller `3px 3px 0` variant for buttons.
- Set global `--radius` to `4px` max (sharp corners). Remove existing soft-shadow / gradient tokens.
- Extend Tailwind with `boxShadow.memphis`, `boxShadow.memphis-sm`, `borderWidth.3`, and font families `display` (Bebas Neue), `mono` (Space Mono), `sans` (DM Sans).

### 2. Typography
- Load Bebas Neue, Space Mono 400/700, DM Sans 400/500 via Google Fonts in `index.html`.
- `body` → DM Sans. All headings (`h1–h3`, card titles, section headers) → Bebas Neue uppercase, wide tracking. Numeric stats and small labels → Space Mono. Replace existing Space Grotesk / JetBrains Mono references.

### 3. Global component restyle (shadcn primitives in `src/components/ui/`)
Minimal edits, just className/variant tweaks — no API changes:
- **Card**: 3px solid ink border, cream/linen background, `shadow-memphis`, no rounded-lg (use `rounded-sm`).
- **Button**: 3px ink border, hard shadow; on hover `translate(-2px,-2px)` + `shadow-memphis`, `rotate(-2deg)` for primary. Variant colors map to salmon / forest / terra / sage.
- **Tabs**: pill triggers with ink border, active tab fills with salmon (or forest), hard shadow on active.
- **Input / Textarea / Select**: 3px ink border, cream background, no focus ring blur — use hard shadow on focus.
- **Badge**: sharp corners, ink border, pattern or solid fill.
- **Dialog / Popover**: ink border + offset shadow, cream surface.
- **Table**: ink borders between rows, header row in forest with cream text Space Mono uppercase.

### 4. Dashboard chrome (no structural changes)
- **App background** (`src/pages/Index.tsx` wrapper): cream with a fixed SVG layer of scattered Memphis shapes (triangles, circles, squiggles, plus, diamond) at ~15% opacity, `pointer-events-none`, behind content. New file `src/components/decor/MemphisScatter.tsx`.
- **Header**: forest bar, Bebas Neue title "FUTUREPROOF ANALYTICS", Space Mono subtitle. Keep existing sign-out / nav elements untouched.
- **Tab bar**: Memphis pill tabs (Overview / Data Entry / AI Insights / etc.) — same tabs, restyled.
- **Section dividers**: thin ink rule + small Space Mono label.

### 5. Overview cards
- Apply card restyle to all overview tiles (Workshop Funnel, Trial Health, All Revenue, Skool metrics).
- Big number → Bebas Neue 48–64px in forest/terra; label → Space Mono uppercase; trend chips → solid color block with ink border.
- Tier breakdown rows, CPA / Blended line: Space Mono.
- Recharts: restyle only colors/strokes — series in salmon / forest / terra / sage, 2px stroke, ink axis lines, cream grid. No structural chart changes.

### 6. Pattern accents (used sparingly so data stays readable)
Add `src/components/decor/Patterns.tsx` exporting reusable SVG pattern fills (checker, polka, hatching, zigzag, stripes). Use only as:
- Card header strip (8px tall bar across the top of each overview card, color varies by section).
- Empty-state backgrounds.
- Behind the page title block.
Never behind table rows or inside form fields.

### 7. Light motion (subtle, no dashboard noise)
- Cards: `animate-fade-in` on mount (already exists), plus hover `translate(-2px,-2px)` + larger hard shadow via Tailwind transition.
- Buttons: hover tilt + shadow shift as specified.
- No GSAP, no ScrollTrigger, no shape-spawning canvas, no marquee — they'd distract from a working analytics tool and would require new deps. If you want them later, easy to add.

### 8. What is explicitly NOT changing
- No edits to `src/integrations/supabase/*`, edge functions, migrations, hooks, data fetching, form submission, calculations, routing, auth, or component prop shapes.
- No tabs added or removed. No fields added or removed.
- No dark mode flip — Memphis Earth is light by nature; existing `.dark` tokens will be remapped to a deeper ink/forest variant for parity but the app effectively becomes a single light theme.

### Files touched
- `src/index.css`, `tailwind.config.ts`, `index.html` (font links)
- `src/components/ui/{card,button,tabs,input,textarea,select,badge,dialog,table}.tsx` — className/variant tweaks only
- `src/pages/Index.tsx` — wrapper bg + scatter layer + header restyle
- `src/components/decor/MemphisScatter.tsx` (new), `src/components/decor/Patterns.tsx` (new)
- Light className passes on `OverviewMetrics`, `WorkshopFunnelOverview`, `AllRevenueOverview`, `TrialHealthCard`, `DataEntry` tab shells, `AIInsights` chat surface — text/color/shadow only.

### Quality bar
- All colors via tokens — no hex literals in components.
- Every card: 3px ink border + 4px ink offset shadow, sharp corners.
- Headings uppercase Bebas Neue everywhere; data in Space Mono.
- Charts and tables remain legible — patterns and scatter shapes never sit under live data.
- Responsive unchanged (already works); patterns scale, scatter hides below `md`.
