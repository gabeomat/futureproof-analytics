import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_TASKS } from "@/lib/taskDefaults";

export interface TaskRow {
  id: string;
  date: string;
  label: string;
  category: string;
  weight: number;
  is_completed: boolean;
  is_default: boolean;
  sort_order: number;
}

const invalidateTasks = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["tasks"] });
  qc.invalidateQueries({ queryKey: ["tasks_range"] });
};

/** Fetch tasks for a single day, seeding defaults the first time. */
export function useDayTasks(date: string) {
  const qc = useQueryClient();
  const seededRef = useRef<Set<string>>(new Set());

  const query = useQuery({
    queryKey: ["tasks", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("date", date)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as TaskRow[];
    },
  });

  // Idempotent seeding — only when the day has zero default rows
  useEffect(() => {
    if (!query.data || query.isLoading) return;
    if (seededRef.current.has(date)) return;
    const hasDefaults = query.data.some((t) => t.is_default);
    if (hasDefaults) {
      seededRef.current.add(date);
      return;
    }
    seededRef.current.add(date);
    (async () => {
      const rows = DEFAULT_TASKS.map((t) => ({
        date,
        label: t.label,
        category: t.category,
        weight: t.weight,
        sort_order: t.sort_order,
        is_default: true,
        is_completed: false,
      }));
      const { error } = await supabase.from("tasks").insert(rows);
      if (!error) invalidateTasks(qc);
    })();
  }, [date, query.data, query.isLoading, qc]);

  return query;
}

/** Fetch tasks across a date range for the heatmap. */
export function useTasksRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["tasks_range", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("date, weight, is_completed")
        .gte("date", startDate)
        .lte("date", endDate);
      if (error) throw error;
      return data as Pick<TaskRow, "date" | "weight" | "is_completed">[];
    },
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase.from("tasks").update({ is_completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useAddCustomTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { date: string; label: string; category: string; weight: number }) => {
      const { error } = await supabase.from("tasks").insert({
        date: input.date,
        label: input.label,
        category: input.category,
        weight: input.weight,
        is_default: false,
        is_completed: false,
        sort_order: 1000,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateTasks(qc),
  });
}
