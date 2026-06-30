import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: ReactNode;
  variant?: "default" | "primary" | "accent" | "warning";
}

const variantStripe: Record<NonNullable<MetricCardProps["variant"]>, string> = {
  default: "bg-sage",
  primary: "bg-forest",
  accent: "bg-salmon",
  warning: "bg-terra",
};

const trendIcons = {
  up: <TrendingUp className="w-3.5 h-3.5" />,
  down: <TrendingDown className="w-3.5 h-3.5" />,
  neutral: <Minus className="w-3.5 h-3.5" />,
};

const trendColors = {
  up: "text-forest",
  down: "text-terra",
  neutral: "text-muted-foreground",
};

export function MetricCard({ title, value, subtitle, trend, trendValue, icon, variant = "default" }: MetricCardProps) {
  return (
    <div className="relative rounded-sm border-3 border-ink bg-cream shadow-memphis animate-slide-up overflow-hidden">
      {/* Memphis color strip */}
      <div className={`h-2 w-full border-b-3 border-ink ${variantStripe[variant]}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink">{title}</span>
          {icon && <span className="text-ink">{icon}</span>}
        </div>
        <div className="font-display text-4xl text-ink leading-none">{value}</div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {trend && trendValue && (
            <span className={`flex items-center gap-1 font-mono text-[10px] font-bold uppercase ${trendColors[trend]}`}>
              {trendIcons[trend]}
              {trendValue}
            </span>
          )}
          {subtitle && <span className="font-mono text-[10px] text-muted-foreground uppercase">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}
