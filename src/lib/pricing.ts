// Futureproof tier pricing. Prices changed on 2026-06-28.
// The DB columns (futureproof_t27/t47/t333) keep their names for continuity
// but semantically represent Standard / Premium / Annual tiers.

export type TierPrices = { standard: number; premium: number; annual: number };

const NEW_PRICING_START = "2026-06-28"; // inclusive

export const LEGACY_PRICES: TierPrices = { standard: 27, premium: 47, annual: 333 };
export const CURRENT_PRICES: TierPrices = { standard: 37, premium: 57, annual: 400 };

export function tierPricesFor(date: string | Date | null | undefined): TierPrices {
  if (!date) return CURRENT_PRICES;
  const d = typeof date === "string" ? date.slice(0, 10) : date.toISOString().slice(0, 10);
  return d >= NEW_PRICING_START ? CURRENT_PRICES : LEGACY_PRICES;
}

export function tierRevenue(
  date: string | Date | null | undefined,
  counts: { standard: number; premium: number; annual: number },
): number {
  const p = tierPricesFor(date);
  return counts.standard * p.standard + counts.premium * p.premium + counts.annual * p.annual;
}
