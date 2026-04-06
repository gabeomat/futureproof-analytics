-- ai_conversations
DROP POLICY IF EXISTS "Allow all access to ai_conversations" ON public.ai_conversations;
CREATE POLICY "Authenticated access to ai_conversations" ON public.ai_conversations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ceo_notes
DROP POLICY IF EXISTS "Allow all access to ceo_notes" ON public.ceo_notes;
CREATE POLICY "Authenticated access to ceo_notes" ON public.ceo_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- churn_events
DROP POLICY IF EXISTS "Allow all access to churn_events" ON public.churn_events;
CREATE POLICY "Authenticated access to churn_events" ON public.churn_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- daily_acquisitions
DROP POLICY IF EXISTS "Allow all access to daily_acquisitions" ON public.daily_acquisitions;
CREATE POLICY "Authenticated access to daily_acquisitions" ON public.daily_acquisitions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- daily_metrics
DROP POLICY IF EXISTS "Allow all access to daily_metrics" ON public.daily_metrics;
CREATE POLICY "Authenticated access to daily_metrics" ON public.daily_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- monthly_revenue
DROP POLICY IF EXISTS "Allow all access to monthly_revenue" ON public.monthly_revenue;
CREATE POLICY "Authenticated access to monthly_revenue" ON public.monthly_revenue FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- strategy_notes
DROP POLICY IF EXISTS "Allow all access to strategy_notes" ON public.strategy_notes;
CREATE POLICY "Authenticated access to strategy_notes" ON public.strategy_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);