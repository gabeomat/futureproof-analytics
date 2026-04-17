export type TaskCategory = "daily" | "content" | "growth" | "product";

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  daily: "Daily Ops",
  content: "Content",
  growth: "Growth",
  product: "Product",
};

export const CATEGORY_ORDER: TaskCategory[] = ["daily", "content", "growth", "product"];

export interface DefaultTask {
  category: TaskCategory;
  label: string;
  weight: number;
  sort_order: number;
}

export const DEFAULT_TASKS: DefaultTask[] = [
  { category: "daily",   label: "Enter Skool metrics",                weight: 1, sort_order: 1 },
  { category: "daily",   label: "Enter ad metrics",                   weight: 1, sort_order: 2 },
  { category: "daily",   label: "Engage in Skool",                    weight: 2, sort_order: 3 },
  { category: "content", label: "Post/share in a Skool community",    weight: 2, sort_order: 4 },
  { category: "content", label: "Work on YouTube video",              weight: 3, sort_order: 5 },
  { category: "content", label: "Send/draft email to list",           weight: 3, sort_order: 6 },
  { category: "growth",  label: "Optimize ad creatives/targeting",    weight: 2, sort_order: 7 },
  { category: "growth",  label: "Reach out for collab/summit",        weight: 3, sort_order: 8 },
  { category: "product", label: "Ship a new tool to library",         weight: 4, sort_order: 9 },
  { category: "product", label: "Create/improve training",            weight: 3, sort_order: 10 },
];
