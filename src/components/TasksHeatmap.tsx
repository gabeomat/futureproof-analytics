import { useMemo } from "react";
import { format, subDays, parseISO } from "date-fns";
import { useTasksRange } from "@/hooks/useTasks";
import { Card } from "@/components/ui/card";

interface Props {
  endDate: string; // YYYY-MM-DD
  days?: number;
  onSelectDate?: (date: string) => void;
  selectedDate?: string;
}

/** Bucket a 0..1 score into one of 4 visual levels. */
function bucket(score: number | null): 0 | 1 | 2 | 3 | 4 {
  if (score === null) return 0;
  if (score <= 0) return 1;
  if (score < 0.4) return 2;
  if (score < 0.75) return 3;
  return 4;
}

const BUCKET_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted/40 border border-border/50",
  1: "bg-primary/10 border border-primary/20",
  2: "bg-primary/30",
  3: "bg-primary/60",
  4: "bg-primary",
};

export function TasksHeatmap({ endDate, days = 60, onSelectDate, selectedDate }: Props) {
  const end = parseISO(endDate);
  const start = subDays(end, days - 1);
  const startStr = format(start, "yyyy-MM-dd");

  const { data } = useTasksRange(startStr, endDate);

  const scoreByDate = useMemo(() => {
    const map = new Map<string, { earned: number; total: number }>();
    (data ?? []).forEach((t) => {
      const entry = map.get(t.date) ?? { earned: 0, total: 0 };
      entry.total += t.weight;
      if (t.is_completed) entry.earned += t.weight;
      map.set(t.date, entry);
    });
    const out = new Map<string, number | null>();
    map.forEach((v, k) => out.set(k, v.total > 0 ? v.earned / v.total : null));
    return out;
  }, [data]);

  // Build the day grid, oldest -> newest, then chunk into rows of 10
  const cells = useMemo(() => {
    const arr: { date: string; score: number | null }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(end, i), "yyyy-MM-dd");
      arr.push({ date: d, score: scoreByDate.get(d) ?? null });
    }
    return arr;
  }, [days, end, scoreByDate]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Output Heatmap</h3>
          <p className="text-xs text-muted-foreground">Last {days} days · weighted completion</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Less</span>
          <div className={`w-3 h-3 rounded-sm ${BUCKET_CLASS[1]}`} />
          <div className={`w-3 h-3 rounded-sm ${BUCKET_CLASS[2]}`} />
          <div className={`w-3 h-3 rounded-sm ${BUCKET_CLASS[3]}`} />
          <div className={`w-3 h-3 rounded-sm ${BUCKET_CLASS[4]}`} />
          <span>More</span>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1">
        {cells.map((c) => {
          const isSelected = c.date === selectedDate;
          const b = bucket(c.score);
          return (
            <button
              key={c.date}
              onClick={() => onSelectDate?.(c.date)}
              title={`${c.date} · ${c.score === null ? "no tasks" : `${Math.round(c.score * 100)}%`}`}
              className={`aspect-square rounded-sm transition-all hover:scale-110 ${BUCKET_CLASS[b]} ${
                isSelected ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""
              }`}
            />
          );
        })}
      </div>
    </Card>
  );
}
