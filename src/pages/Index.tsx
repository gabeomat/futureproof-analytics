import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, Users, TrendingDown, Target, Zap, BarChart3, ClipboardEdit, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/MetricCard";
import { MRRChart, RevenueBreakdownChart } from "@/components/RevenueChart";
import { ChurnChart } from "@/components/ChurnAnalysis";
import { MemberComposition } from "@/components/MemberComposition";
import { DualMRRView } from "@/components/DualMRRView";
import { ProjectionPlayground } from "@/components/ProjectionPlayground";
import { DataEntry } from "@/components/DataEntry";
import { AIInsights } from "@/components/AIInsights";
import { formatCurrency, formatPercent } from "@/lib/data";
import { useLiveMetrics } from "@/hooks/useLiveMetrics";

type Tab = "overview" | "projections" | "data-entry";

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const currentSnapshot = useLiveMetrics();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
                  Futureproof<span className="text-primary"> Analytics</span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">The Evolution Lab · MRR & Growth Intelligence</p>
              </div>
              <AIInsights />
            </div>
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "overview" ? "bg-primary text-primary-foreground" : "text-secondary-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("projections")}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "projections" ? "bg-primary text-primary-foreground" : "text-secondary-foreground hover:text-foreground"
                }`}
              >
                <Zap className="w-3.5 h-3.5 inline mr-1.5" />
                MRR Playground
              </button>
              <button
                onClick={() => setActiveTab("data-entry")}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "data-entry" ? "bg-primary text-primary-foreground" : "text-secondary-foreground hover:text-foreground"
                }`}
              >
                <ClipboardEdit className="w-3.5 h-3.5 inline mr-1.5" />
                Data Entry
              </button>
            </div>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
              className="ml-3 p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {activeTab === "overview" ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <MetricCard
                title="Pure Monthly MRR"
                value={formatCurrency(currentSnapshot.pureMonthlyMRR)}
                trend="up"
                trendValue="+$378 this month"
                icon={<DollarSign className="w-4 h-4" />}
                variant="primary"
              />
              <MetricCard
                title="Skool MRR"
                value={formatCurrency(currentSnapshot.skoolMRR)}
                subtitle="Includes annualized annual"
                icon={<DollarSign className="w-4 h-4" />}
              />
              <MetricCard
                title="Paying Members"
                value={`${currentSnapshot.payingMembers}`}
                subtitle={`${currentSnapshot.monthlyPayingMembers} monthly · ${currentSnapshot.annualPayingMembers} annual`}
                icon={<Users className="w-4 h-4" />}
              />
              <MetricCard
                title="Revenue Churn"
                value={formatPercent(currentSnapshot.avgChurnRate)}
                trend="down"
                trendValue={`Target: ${formatPercent(currentSnapshot.targetChurnRate)}`}
                icon={<TrendingDown className="w-4 h-4" />}
                variant="warning"
              />
              <MetricCard
                title="Calculated LTV"
                value={formatCurrency(currentSnapshot.calculatedLTV)}
                subtitle={`Skool: ${formatCurrency(currentSnapshot.skoolLTV)}`}
                icon={<Target className="w-4 h-4" />}
              />
              <MetricCard
                title="Legacy Members"
                value={`${currentSnapshot.legacyMembers}`}
                subtitle={`${((currentSnapshot.legacyMembers / currentSnapshot.payingMembers) * 100).toFixed(0)}% of paying base`}
                trend="down"
                trendValue="Shrinking (good)"
              />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MRRChart />
              <RevenueBreakdownChart />
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChurnChart />
              <MemberComposition />
            </div>

            {/* Dual MRR View */}
            <DualMRRView />
          </>
        ) : activeTab === "projections" ? (
          <>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">MRR Projection Playground</h2>
              <p className="text-sm text-muted-foreground mt-1">Adjust the levers to see how growth, churn, and pricing changes impact your MRR trajectory</p>
            </div>
            <ProjectionPlayground />
          </>
        ) : (
          <>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Monthly Data Entry</h2>
              <p className="text-sm text-muted-foreground mt-1">Input your Skool MRR breakdown each month — New, Upgrades, Existing, Downgrades, Churn</p>
            </div>
            <DataEntry />
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
