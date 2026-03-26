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

const variantStyles = {
  default: "bg-card border-border",
  primary: "bg-card border-primary/20 shadow-glow",
  accent: "bg-card border-accent/20",
  warning: "bg-card border-warning/20",
};

const trendIcons = {
  up: <TrendingUp className="w-3.5 h-3.5" />,
  down: <TrendingDown className="w-3.5 h-3.5" />,
  neutral: <Minus className="w-3.5 h-3.5" />,
};

const trendColors = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
};

export function MetricCard({ title, value, subtitle, trend, trendValue, icon, variant = "default" }: MetricCardProps) {
  return (
    <div className={`rounded-lg border p-5 animate-slide-up ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="font-display text-2xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="flex items-center gap-2 mt-2">
        {trend && trendValue && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trendColors[trend]}`}>
            {trendIcons[trend]}
            {trendValue}
          </span>
        )}
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  );
}
