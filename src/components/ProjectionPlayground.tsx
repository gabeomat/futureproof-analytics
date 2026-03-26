import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Slider } from "@/components/ui/slider";
import { defaultInputs, runProjection, formatCurrency, formatPercent, type ProjectionInputs } from "@/lib/data";

function SliderInput({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <span className="text-xs font-mono font-semibold text-foreground">{format(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} className="w-full" />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-card">
      <p className="text-xs font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium text-foreground">
            {entry.name.includes("%") ? formatPercent(entry.value) : 
             entry.name === "ARPU" ? `$${entry.value.toFixed(2)}` :
             formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function ProjectionPlayground() {
  const [inputs, setInputs] = useState<ProjectionInputs>(defaultInputs);
  const [timeframe, setTimeframe] = useState(12);

  const projection = useMemo(() => runProjection(inputs, timeframe), [inputs, timeframe]);
  
  const endMRR = projection[projection.length - 1]?.mrr ?? 0;
  const mrrGrowth = endMRR - projection[0].mrr;
  const monthsToDouble = projection.findIndex(p => p.mrr >= projection[0].mrr * 2);

  const update = (key: keyof ProjectionInputs) => (val: number) =>
    setInputs(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      {/* Timeframe selector */}
      <div className="flex items-center gap-2">
        {[3, 6, 12].map(t => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              timeframe === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t} months
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-lg border border-border bg-card p-5 space-y-5">
            <h4 className="font-display text-sm font-semibold text-foreground">Growth Levers</h4>
            <SliderInput label="New $27/mo members" value={inputs.newT27PerMonth} min={0} max={30} step={1} onChange={update("newT27PerMonth")} format={v => `${v}/mo`} />
            <SliderInput label="New $47/mo members" value={inputs.newT47PerMonth} min={0} max={30} step={1} onChange={update("newT47PerMonth")} format={v => `${v}/mo`} />
            <SliderInput label="New $333/yr members" value={inputs.newT333PerMonth} min={0} max={20} step={1} onChange={update("newT333PerMonth")} format={v => `${v}/mo`} />
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-5">
            <h4 className="font-display text-sm font-semibold text-foreground">Churn</h4>
            <SliderInput label="Monthly churn rate" value={inputs.monthlyChurnRate} min={0} max={30} step={0.5} onChange={update("monthlyChurnRate")} format={v => formatPercent(v)} />
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-5">
            <h4 className="font-display text-sm font-semibold text-foreground">Pricing Scenarios</h4>
            <SliderInput label="Entry tier" value={inputs.entryPrice} min={9} max={97} step={1} onChange={update("entryPrice")} format={v => formatCurrency(v)} />
            <SliderInput label="Premium tier" value={inputs.premiumPrice} min={27} max={197} step={1} onChange={update("premiumPrice")} format={v => formatCurrency(v)} />
            <SliderInput label="Annual tier" value={inputs.annualPrice} min={97} max={997} step={1} onChange={update("annualPrice")} format={v => formatCurrency(v)} />
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-5">
            <h4 className="font-display text-sm font-semibold text-foreground">Ad Spend</h4>
            <SliderInput label="Monthly budget" value={inputs.monthlyAdBudget} min={0} max={10000} step={100} onChange={update("monthlyAdBudget")} format={v => formatCurrency(v)} />
            <SliderInput label="CPA" value={inputs.cpa} min={1} max={200} step={1} onChange={update("cpa")} format={v => formatCurrency(v)} />
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6 lg:col-span-2">
          {/* Result cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Projected MRR</p>
              <p className="font-display text-xl font-bold text-primary">{formatCurrency(endMRR)}</p>
              <p className="text-xs text-success mt-1">+{formatCurrency(mrrGrowth)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Months to 2× MRR</p>
              <p className="font-display text-xl font-bold text-foreground">
                {monthsToDouble > 0 ? monthsToDouble : monthsToDouble === 0 ? "Now" : `>${timeframe}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Target: {formatCurrency(projection[0].mrr * 2)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">End ARPU</p>
              <p className="font-display text-xl font-bold text-foreground">${projection[projection.length - 1]?.arpu.toFixed(2)}</p>
              <p className="text-xs text-success mt-1">vs ${projection[0]?.arpu.toFixed(2)} now</p>
            </div>
          </div>

          {/* MRR Projection chart */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">MRR Projection</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={projection}>
                <defs>
                  <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(172, 66%, 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(172, 66%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="label" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="mrr" stroke="hsl(172, 66%, 50%)" strokeWidth={2.5} fill="url(#projGradient)" name="Projected MRR" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legacy tailwind + ARPU chart */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">Legacy Pricing Tailwind</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={projection}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="label" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="members" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="arpu" orientation="right" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="members" type="monotone" dataKey="legacyMembers" stroke="hsl(262, 60%, 58%)" strokeWidth={2} dot={false} name="Legacy Members" />
                <Line yAxisId="arpu" type="monotone" dataKey="arpu" stroke="hsl(172, 66%, 50%)" strokeWidth={2} dot={false} name="ARPU" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
