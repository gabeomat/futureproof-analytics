-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT tasks_category_check CHECK (category IN ('daily', 'content', 'growth', 'product')),
  CONSTRAINT tasks_weight_check CHECK (weight BETWEEN 1 AND 5)
);

-- Indexes for common query patterns
CREATE INDEX idx_tasks_date ON public.tasks(date DESC);
CREATE INDEX idx_tasks_date_cat_sort ON public.tasks(date, category, sort_order);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Match the project's auth pattern: any authenticated user has full access
CREATE POLICY "Authenticated access to tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Auto-update updated_at on changes (reuse existing function)
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();