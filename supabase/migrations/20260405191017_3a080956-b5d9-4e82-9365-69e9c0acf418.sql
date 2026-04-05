CREATE TABLE IF NOT EXISTS public.ceo_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  biggest_win TEXT NOT NULL DEFAULT '',
  biggest_bottleneck TEXT NOT NULL DEFAULT '',
  todays_focus TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

ALTER TABLE public.ceo_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to ceo_notes" ON public.ceo_notes FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TRIGGER update_ceo_notes_updated_at BEFORE UPDATE ON public.ceo_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();