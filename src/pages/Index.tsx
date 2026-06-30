import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, Users, TrendingDown, Target, Zap, BarChart3, ClipboardEdit, LogOut, CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/MetricCard";
import { MRRChart, RevenueBreakdownChart } from "@/components/RevenueChart";
import { ChurnChart } from "@/components/ChurnAnalysis";
import { MemberComposition } from "@/components/MemberComposition";
import { DualMRRView } from "@/components/DualMRRView";
import { ProjectionPlayground } from "@/components/ProjectionPlayground";
import { DataEntry } from "@/components/DataEntry";
import { TasksTab } from "@/components/TasksTab";
import { AIInsights } from "@/components/AIInsights";
import { WorkshopFunnelOverview } from "@/components/WorkshopFunnelOverview";
import { TrialHealthCard } from "@/components/TrialHealthCard";
import { AllRevenueOverview } from "@/components/AllRevenueOverview";
import { MemphisScatter } from "@/components/decor/MemphisScatter";
import { formatCurrency, formatPercent } from "@/lib/data";
import { useLiveMetrics } from "@/hooks/useLiveMetrics";

type Tab = "overview" | "projections" | "data-entry" | "tasks";
type FunnelView = "workshop" | "direct" | "all";

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [funnelView, setFunnelView] = useState<FunnelView>("workshop");
  const currentSnapshot = useLiveMetrics();

  return (
    <div className="min-h-screen bg-cream relative">
      <MemphisScatter />

      {/* Header */}
      <header className="relative z-10 border-b-3 border-ink bg-cream sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-display text-3xl text-ink leading-none tracking-wide">
                  FUTUREPROOF <span className="text-terra">ANALYTICS</span>
                </h1>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink/70 mt-1">
                  The Evolution Lab · MRR &amp; Growth Intelligence
                </p>
              </div>
              <AIInsights />
            </div>
            <div className="flex items-center gap-1 bg-linen border-3 border-ink rounded-sm p-1 shadow-memphis-sm">
              {([
                { id: "overview", label: "Overview", Icon: BarChart3 },
                { id: "projections", label: "MRR Playground", Icon: Zap },
                { id: "data-entry", label: "Data Entry", Icon: ClipboardEdit },
                { id: "tasks", label: "Tasks", Icon: CheckSquare },
              ] as const).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as Tab)}
                  className={`px-3 py-1.5 rounded-sm font-mono text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activeTab === id
                      ? "bg-salmon text-ink border-3 border-ink"
                      : "border-3 border-transparent text-ink hover:bg-cream"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
              className="p-2 rounded-sm border-3 border-ink bg-cream text-ink shadow-memphis-sm hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-memphis transition-all"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-6 space-y-6">
        {activeTab === "overview" ? (
          <>
            {/* Funnel toggle */}
            <div className="flex items-center gap-1 bg-linen border-3 border-ink rounded-sm p-1 w-fit shadow-memphis-sm">
              {([
                { v: "workshop", label: "Workshop Funnel" },
                { v: "direct", label: "Direct-to-Skool (Legacy)" },
                { v: "all", label: "All Revenue" },
              ] as const).map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setFunnelView(opt.v)}
                  className={`px-3 py-1.5 rounded-sm font-mono text-[11px] font-bold uppercase tracking-wider transition-all ${
                    funnelView === opt.v
                      ? "bg-forest text-cream border-3 border-ink"
                      : "border-3 border-transparent text-ink hover:bg-cream"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {funnelView === "workshop" ? (
              <>
                <WorkshopFunnelOverview />
                <TrialHealthCard />
              </>
            ) : funnelView === "all" ? (
              <>
                <AllRevenueOverview />
                <TrialHealthCard />
              </>
            ) : (
              <>
                {/* Direct-to-Skool legacy: original Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <MetricCard title="Pure Monthly MRR" value={formatCurrency(currentSnapshot.pureMonthlyMRR)} trend="up" trendValue="+$378 this month" icon={<DollarSign className="w-4 h-4" />} variant="primary" />
                  <MetricCard title="Skool MRR" value={formatCurrency(currentSnapshot.skoolMRR)} subtitle="Includes annualized annual" icon={<DollarSign className="w-4 h-4" />} />
                  <MetricCard title="Paying Members" value={`${currentSnapshot.payingMembers}`} subtitle={`${currentSnapshot.monthlyPayingMembers} monthly · ${currentSnapshot.annualPayingMembers} annual`} icon={<Users className="w-4 h-4" />} />
                  <MetricCard title="Revenue Churn" value={formatPercent(currentSnapshot.avgChurnRate)} trend="down" trendValue={`Target: ${formatPercent(currentSnapshot.targetChurnRate)}`} icon={<TrendingDown className="w-4 h-4" />} variant="warning" />
                  <MetricCard title="Calculated LTV" value={formatCurrency(currentSnapshot.calculatedLTV)} subtitle={`Skool: ${formatCurrency(currentSnapshot.skoolLTV)}`} icon={<Target className="w-4 h-4" />} />
                  <MetricCard title="Legacy Members" value={`${currentSnapshot.legacyMembers}`} subtitle={`${((currentSnapshot.legacyMembers / currentSnapshot.payingMembers) * 100).toFixed(0)}% of paying base`} trend="down" trendValue="Shrinking (good)" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MRRChart />
                  <RevenueBreakdownChart />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChurnChart />
                  <MemberComposition />
                </div>
                <DualMRRView />
              </>
            )}
          </>
        ) : activeTab === "projections" ? (
          <>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">MRR Projection Playground</h2>
              <p className="text-sm text-muted-foreground mt-1">Adjust the levers to see how growth, churn, and pricing changes impact your MRR trajectory</p>
            </div>
            <ProjectionPlayground />
          </>
        ) : activeTab === "data-entry" ? (
          <>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Monthly Data Entry</h2>
              <p className="text-sm text-muted-foreground mt-1">Input your Skool MRR breakdown each month — New, Upgrades, Existing, Downgrades, Churn</p>
            </div>
            <DataEntry />
          </>
        ) : (
          <>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Daily Tasks</h2>
              <p className="text-sm text-muted-foreground mt-1">Track strategic output with weighted completion — checkboxes are nice, but weight is what moves the needle</p>
            </div>
            <TasksTab />
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
