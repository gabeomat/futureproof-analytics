
-- 1. Roles infrastructure
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2. Seed admin role for every existing user (single-owner dashboard, signups disabled)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Tighten all public table policies to admins only
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'ai_conversations','ceo_notes','churn_events','daily_acquisitions',
    'daily_metrics','funnel_daily','monthly_revenue','strategy_notes',
    'tasks','workshops'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated access to %I" ON public.%I', t, t);
    EXECUTE format($p$CREATE POLICY "Admin access to %1$I" ON public.%1$I
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'))$p$, t);
  END LOOP;
END $$;

-- 4. Storage: scope chat-uploads by per-user path prefix (uid/...)
DROP POLICY IF EXISTS "Authenticated users can read chat-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from chat-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to chat-uploads" ON storage.objects;

CREATE POLICY "Users read own chat-uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users upload own chat-uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own chat-uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
