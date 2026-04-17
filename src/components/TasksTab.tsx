import { useMemo, useState } from "react";
import { format, addDays, subDays, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useDayTasks,
  useToggleTask,
  useAddCustomTask,
  useDeleteTask,
  TaskRow,
} from "@/hooks/useTasks";
import { CATEGORY_LABELS, CATEGORY_ORDER, TaskCategory } from "@/lib/taskDefaults";
import { TasksHeatmap } from "./TasksHeatmap";

const todayStr = () => format(new Date(), "yyyy-MM-dd");

function WeightDots({ weight }: { weight: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`Weight ${weight}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            i <= weight ? "bg-primary" : "bg-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
}

export function TasksTab() {
  const [date, setDate] = useState<string>(todayStr());
  const { data: tasks = [], isLoading } = useDayTasks(date);
  const toggle = useToggleTask();
  const addCustom = useAddCustomTask();
  const del = useDeleteTask();

  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState<TaskCategory>("daily");
  const [newWeight, setNewWeight] = useState<number>(2);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<TaskCategory, TaskRow[]>();
    CATEGORY_ORDER.forEach((c) => map.set(c, []));
    tasks.forEach((t) => {
      const arr = map.get(t.category as TaskCategory);
      if (arr) arr.push(t);
    });
    return map;
  }, [tasks]);

  // Weighted completion score
  const score = useMemo(() => {
    const total = tasks.reduce((s, t) => s + t.weight, 0);
    if (total === 0) return 0;
    const earned = tasks.filter((t) => t.is_completed).reduce((s, t) => s + t.weight, 0);
    return earned / total;
  }, [tasks]);

  const scorePct = Math.round(score * 100);
  const scoreColor =
    scorePct >= 75 ? "text-primary" : scorePct >= 40 ? "text-foreground" : "text-muted-foreground";

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addCustom.mutate(
      { date, label: newLabel.trim(), category: newCategory, weight: newWeight },
      { onSuccess: () => setNewLabel("") }
    );
  };

  const isToday = date === todayStr();

  return (
    <div className="space-y-6">
      {/* Header: date nav + score */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDate(format(subDays(parseISO(date), 1), "yyyy-MM-dd"))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[200px] justify-start font-normal">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {format(parseISO(date), "EEE, MMM d, yyyy")}
                {isToday && <span className="ml-2 text-xs text-primary">· Today</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseISO(date)}
                onSelect={(d) => d && setDate(format(d, "yyyy-MM-dd"))}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDate(format(addDays(parseISO(date), 1), "yyyy-MM-dd"))}
            disabled={date >= todayStr()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          {!isToday && (
            <Button variant="ghost" size="sm" onClick={() => setDate(todayStr())}>
              Today
            </Button>
          )}
        </div>

        <Card className="px-5 py-3 flex items-center gap-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Weighted Output</div>
            <div className={cn("text-3xl font-display font-bold tabular-nums", scoreColor)}>
              {scorePct}%
            </div>
          </div>
          <div className="text-xs text-muted-foreground border-l border-border pl-4">
            <div>{tasks.filter((t) => t.is_completed).length} / {tasks.length} done</div>
            <div className="opacity-70">Strategic output, not checkbox count</div>
          </div>
        </Card>
      </div>

      {/* Heatmap */}
      <TasksHeatmap endDate={todayStr()} days={60} onSelectDate={setDate} selectedDate={date} />

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped.get(cat) ?? [];
          return (
            <Card key={cat} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">{CATEGORY_LABELS[cat]}</h3>
                <span className="text-xs text-muted-foreground">
                  {items.filter((i) => i.is_completed).length}/{items.length}
                </span>
              </div>
              {isLoading ? (
                <div className="text-xs text-muted-foreground py-2">Loading…</div>
              ) : items.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2">No tasks</div>
              ) : (
                <ul className="space-y-1.5">
                  {items.map((t) => (
                    <li
                      key={t.id}
                      className="group flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-secondary/50 transition-colors"
                    >
                      <Checkbox
                        checked={t.is_completed}
                        onCheckedChange={(v) =>
                          toggle.mutate({ id: t.id, is_completed: !!v })
                        }
                      />
                      <span
                        className={cn(
                          "text-sm flex-1",
                          t.is_completed && "line-through text-muted-foreground"
                        )}
                      >
                        {t.label}
                      </span>
                      <WeightDots weight={t.weight} />
                      {!t.is_default && (
                        <button
                          onClick={() => del.mutate(t.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add custom task */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Add Custom Task</h3>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="What needs doing?"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 min-w-[200px]"
          />
          <Select value={newCategory} onValueChange={(v) => setNewCategory(v as TaskCategory)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_ORDER.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(newWeight)} onValueChange={(v) => setNewWeight(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((w) => (
                <SelectItem key={w} value={String(w)}>
                  Weight {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!newLabel.trim() || addCustom.isPending}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </Card>
    </div>
  );
}
