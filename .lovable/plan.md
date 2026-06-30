## Goal
Increase font sizes globally across the Overview page for better readability. No structural/logic changes, no collapsing behavior.

## Changes

**1. `src/components/MetricCard.tsx`**
- Label: `text-xs` → `text-sm`
- Value: `text-3xl` → `text-4xl` (or `text-5xl` for the hero numbers)
- Sublabel/delta: bump one step up

**2. `src/components/WorkshopFunnelOverview.tsx`**
- Section headings (Bebas Neue): `text-2xl` → `text-3xl`
- Per-workshop row labels and metric text: bump one Tailwind step
- "Ad spend / CPA / Blended" inline line: `text-sm` → `text-base`
- Tier breakdown counts: one step up

**3. `src/components/AllRevenueOverview.tsx`**
- Match the same step-up treatment as Workshop view for parity

**4. `src/components/DualMRRView.tsx`**
- MRR headline numbers one step larger; supporting labels one step larger

**5. `src/components/TrialHealthCard.tsx`**
- Card heading + metric values bumped one step

## Guardrails
- Only typography size/weight tweaks. No color changes, no layout restructuring, no logic edits, no data/query changes.
- Keep Memphis design tokens (Bebas Neue headers, Space Mono labels, DM Sans body) intact — just larger.
- Spot-check at 1280px and mobile to make sure nothing overflows; if a card overflows, widen line-height or allow wrap rather than shrinking back.