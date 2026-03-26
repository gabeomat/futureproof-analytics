// Historical revenue data from Skool (Sep 2025 – Feb 2026)
export interface MonthlyRevenue {
  month: string;
  monthShort: string;
  new: number;
  upgrades: number;
  existing: number;
  downgrades: number;
  churn: number;
  mrr: number;
}

export const historicalRevenue: MonthlyRevenue[] = [
  { month: "Sep 2025", monthShort: "Sep", new: 30, upgrades: 0, existing: 0, downgrades: 0, churn: 0, mrr: 30 },
  { month: "Oct 2025", monthShort: "Oct", new: 427, upgrades: 0, existing: 30, downgrades: 0, churn: -9, mrr: 448 },
  { month: "Nov 2025", monthShort: "Nov", new: 94, upgrades: 0, existing: 448, downgrades: 0, churn: -72, mrr: 470 },
  { month: "Dec 2025", monthShort: "Dec", new: 760, upgrades: 0, existing: 470, downgrades: 0, churn: -45, mrr: 1185 },
  { month: "Jan 2026", monthShort: "Jan", new: 437, upgrades: 58, existing: 1208, downgrades: -29, churn: -202, mrr: 1472 },
  { month: "Feb 2026", monthShort: "Feb", new: 1249, upgrades: 0, existing: 1472, downgrades: 0, churn: -231, mrr: 2537 },
  { month: "Mar 2026", monthShort: "Mar", new: 378, upgrades: 0, existing: 2537, downgrades: 0, churn: 0, mrr: 2915 },
];

// Current member composition
export interface MemberBreakdown {
  label: string;
  count: number;
  monthlyRevenue: number;
  color: string;
}

export const monthlyMembers: MemberBreakdown[] = [
  { label: "$47/mo", count: 40, monthlyRevenue: 1880, color: "hsl(172, 66%, 50%)" },
  { label: "$27/mo", count: 2, monthlyRevenue: 54, color: "hsl(200, 70%, 55%)" },
  { label: "$18/mo (legacy)", count: 21, monthlyRevenue: 378, color: "hsl(262, 60%, 58%)" },
  { label: "$9/mo (legacy)", count: 1, monthlyRevenue: 9, color: "hsl(290, 60%, 55%)" },
];

export const annualMembers: MemberBreakdown[] = [
  { label: "$333/yr", count: 15, monthlyRevenue: 416.25, color: "hsl(38, 92%, 55%)" },
  { label: "$267/yr (legacy)", count: 3, monthlyRevenue: 66.75, color: "hsl(30, 70%, 50%)" },
  { label: "$111/yr (legacy)", count: 7, monthlyRevenue: 64.75, color: "hsl(20, 60%, 45%)" },
  { label: "$50/yr (legacy)", count: 11, monthlyRevenue: 45.83, color: "hsl(10, 50%, 40%)" },
];

// Churn data
export interface ChurnData {
  month: string;
  churnDollars: number;
  existingDollars: number;
  revenueChurnRate: number;
}

export const historicalChurn: ChurnData[] = [
  { month: "Sep 2025", churnDollars: 0, existingDollars: 0, revenueChurnRate: 0 },
  { month: "Oct 2025", churnDollars: 9, existingDollars: 30, revenueChurnRate: 23.1 },
  { month: "Nov 2025", churnDollars: 72, existingDollars: 448, revenueChurnRate: 13.8 },
  { month: "Dec 2025", churnDollars: 45, existingDollars: 470, revenueChurnRate: 8.7 },
  { month: "Jan 2026", churnDollars: 202, existingDollars: 1208, revenueChurnRate: 14.3 },
  { month: "Feb 2026", churnDollars: 231, existingDollars: 1472, revenueChurnRate: 13.6 },
];

// Current snapshot
export const currentSnapshot = {
  totalMembers: 167,
  freeMembers: 67,
  payingMembers: 100,
  monthlyPayingMembers: 64,
  annualPayingMembers: 36,
  skoolMRR: 2915,
  pureMonthlyMRR: 2321,
  annualizedContribution: 593.58,
  legacyMembers: 43,
  currentPricingMembers: 57,
  skoolARPU: 28,
  skoolLTV: 413,
  calculatedLTV: 215,
  avgChurnRate: 13.5,
  targetChurnRate: 8,
  monthlyAdSpend: 3500,
};

// Projection calculation engine
export interface ProjectionInputs {
  newT27PerMonth: number;
  newT47PerMonth: number;
  newT333PerMonth: number;
  monthlyChurnRate: number;
  entryPrice: number;
  premiumPrice: number;
  annualPrice: number;
  monthlyAdBudget: number;
  cpa: number;
}

export interface ProjectionMonth {
  month: number;
  label: string;
  mrr: number;
  totalMembers: number;
  legacyMembers: number;
  currentMembers: number;
  annualCash: number;
  totalRevenue: number;
  arpu: number;
  ltv: number;
  roas: number;
}

export const defaultInputs: ProjectionInputs = {
  newT27PerMonth: 3,
  newT47PerMonth: 8,
  newT333PerMonth: 3,
  monthlyChurnRate: 13.5,
  entryPrice: 27,
  premiumPrice: 47,
  annualPrice: 333,
  monthlyAdBudget: 3500,
  cpa: 45,
};

export function runProjection(inputs: ProjectionInputs, months: number = 12): ProjectionMonth[] {
  const results: ProjectionMonth[] = [];
  
  let currentMRR = currentSnapshot.pureMonthlyMRR;
  let monthlyMembers = currentSnapshot.monthlyPayingMembers;
  let legacyMonthly = 22; // legacy monthly members
  let annualMembers = currentSnapshot.annualPayingMembers;
  const churnRate = inputs.monthlyChurnRate / 100;

  for (let m = 0; m <= months; m++) {
    const currentPricedMonthly = monthlyMembers - legacyMonthly;
    const legacyAvgPrice = 17.59;
    
    // ARPU calculation
    const totalMonthlyRev = currentMRR;
    const arpu = monthlyMembers > 0 ? totalMonthlyRev / monthlyMembers : 0;
    const ltv = churnRate > 0 ? arpu / churnRate : 0;
    
    // ROAS
    const newMemberRevenue = (inputs.newT27PerMonth * inputs.entryPrice + inputs.newT47PerMonth * inputs.premiumPrice);
    const roas = inputs.monthlyAdBudget > 0 ? (newMemberRevenue * (1 / churnRate)) / inputs.monthlyAdBudget : 0;

    results.push({
      month: m,
      label: m === 0 ? "Now" : `M+${m}`,
      mrr: Math.round(currentMRR),
      totalMembers: monthlyMembers + annualMembers,
      legacyMembers: legacyMonthly,
      currentMembers: currentPricedMonthly,
      annualCash: inputs.newT333PerMonth * inputs.annualPrice,
      totalRevenue: Math.round(currentMRR + inputs.newT333PerMonth * inputs.annualPrice / 12),
      arpu: Math.round(arpu * 100) / 100,
      ltv: Math.round(ltv),
      roas: Math.round(roas * 100) / 100,
    });

    if (m < months) {
      // Churn from monthly members
      const churned = Math.round(monthlyMembers * churnRate);
      const legacyChurned = Math.round(legacyMonthly * churnRate);
      const currentChurned = churned - legacyChurned;
      
      // Revenue lost to churn
      const legacyChurnRevenue = legacyChurned * legacyAvgPrice;
      const currentChurnRevenue = currentChurned * arpu;
      
      // New members
      const newMembers = inputs.newT27PerMonth + inputs.newT47PerMonth;
      const newRevenue = inputs.newT27PerMonth * inputs.entryPrice + inputs.newT47PerMonth * inputs.premiumPrice;
      
      // Update
      currentMRR = currentMRR - legacyChurnRevenue - currentChurnRevenue + newRevenue;
      legacyMonthly = Math.max(0, legacyMonthly - legacyChurned);
      monthlyMembers = monthlyMembers - churned + newMembers;
      annualMembers = annualMembers + inputs.newT333PerMonth;
    }
  }

  return results;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
