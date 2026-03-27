CREATE TABLE public.daily_acquisitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  ad_spend NUMERIC NOT NULL DEFAULT 0,
  ad_conv_27 INTEGER NOT NULL DEFAULT 0,
  ad_conv_47 INTEGER NOT NULL DEFAULT 0,
  ad_conv_333 INTEGER NOT NULL DEFAULT 0,
  organic_27 INTEGER NOT NULL DEFAULT 0,
  organic_47 INTEGER NOT NULL DEFAULT 0,
  organic_333 INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_acquisitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to daily_acquisitions"
  ON public.daily_acquisitions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);