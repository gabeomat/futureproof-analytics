CREATE TABLE public.strategy_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary text NOT NULL,
  source_conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.strategy_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to strategy_notes"
ON public.strategy_notes
FOR ALL
TO public
USING (true)
WITH CHECK (true);