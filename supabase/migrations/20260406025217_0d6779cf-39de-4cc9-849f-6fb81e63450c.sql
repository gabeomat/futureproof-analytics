
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  priority_actions text NOT NULL DEFAULT '',
  key_metrics text NOT NULL DEFAULT '',
  warnings text NOT NULL DEFAULT '',
  opportunities text NOT NULL DEFAULT '',
  full_summary text NOT NULL DEFAULT '',
  source_conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE SET NULL
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access to ai_insights"
  ON public.ai_insights
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
