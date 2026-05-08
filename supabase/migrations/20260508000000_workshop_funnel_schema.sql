-- Workshop funnel schema
-- Replaces the direct-to-Skool unit economics encoded in `daily_acquisitions`
-- with a funnel-aware model. `daily_acquisitions` is left intact so
-- historical direct-to-Skool data is preserved and that funnel can be
-- restarted at any time.
--
-- Two new tables:
--   workshops    — one row per workshop event (May 2, May 16, ...). Each
--                  workshop is its own launch with its own P&L.
--   funnel_daily — one row per (date, funnel) and optionally workshop_id.
--                  Daily aggregates: ad spend, registrations split by
--                  paid/organic, revenue per product, Futureproof signups
--                  by tier. Future funnels (post-Intensive) plug in by
--                  adding a new `funnel` value, no schema change.

-- =============================================================
-- workshops: per-launch facts (set once, updated as cohort progresses)
-- =============================================================
CREATE TABLE public.workshops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT 'Create Your Living Workspace',

  -- Attribution window for ads + email promo for this cohort.
  -- Spend during this window attributes to this workshop.
  registration_window_start DATE NOT NULL,
  registration_window_end DATE NOT NULL,

  -- Registration totals (set after the cohort closes).
  total_registrations INTEGER NOT NULL DEFAULT 0,
  meta_attributed_registrations INTEGER NOT NULL DEFAULT 0,

  -- Workshop day facts. NULL until the workshop runs.
  attended INTEGER,

  -- Back-end Intensive offer for this cohort.
  intensive_price NUMERIC(10,2) NOT NULL,
  intensive_waitlist_mode BOOLEAN NOT NULL DEFAULT false,
  intensive_applications INTEGER NOT NULL DEFAULT 0,
  intensive_declined INTEGER NOT NULL DEFAULT 0,
  intensive_closes INTEGER NOT NULL DEFAULT 0,

  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  CONSTRAINT workshops_window_order CHECK (registration_window_start <= registration_window_end),
  CONSTRAINT workshops_window_ends_on_workshop CHECK (registration_window_end <= workshop_date),
  CONSTRAINT workshops_apps_consistent CHECK (intensive_declined + intensive_closes <= intensive_applications)
);

CREATE INDEX idx_workshops_date ON public.workshops(workshop_date DESC);

ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access to workshops"
ON public.workshops
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_workshops_updated_at
BEFORE UPDATE ON public.workshops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- =============================================================
-- funnel_daily: one row per (date, funnel, workshop_id)
-- Daily aggregate flow numbers. Workshop-level totals (attended,
-- applications, declined, closes) live on `workshops`, not here.
-- =============================================================
CREATE TABLE public.funnel_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  funnel TEXT NOT NULL,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL,

  ad_spend NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Registration split: Meta pixel-attributed vs everything else.
  registrations_paid INTEGER NOT NULL DEFAULT 0,
  registrations_organic INTEGER NOT NULL DEFAULT 0,

  -- Revenue per product (lands on the day money is collected).
  workshop_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  intensive_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  futureproof_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Futureproof signups split by tier.
  futureproof_t27 INTEGER NOT NULL DEFAULT 0,
  futureproof_t47 INTEGER NOT NULL DEFAULT 0,
  futureproof_t333 INTEGER NOT NULL DEFAULT 0,

  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  CONSTRAINT funnel_daily_funnel_check CHECK (funnel IN ('workshop', 'direct_skool')),
  -- workshop funnel rows must reference a workshop; direct_skool rows must not.
  CONSTRAINT funnel_daily_workshop_link CHECK (
    (funnel = 'workshop' AND workshop_id IS NOT NULL)
    OR (funnel = 'direct_skool' AND workshop_id IS NULL)
  )
);

-- Prevent double-entry of the same (date, funnel, workshop) combination.
-- Two unique indexes because a NULL workshop_id (direct_skool) doesn't
-- collide cleanly in a single composite unique.
CREATE UNIQUE INDEX idx_funnel_daily_workshop_unique
  ON public.funnel_daily(date, funnel, workshop_id)
  WHERE workshop_id IS NOT NULL;

CREATE UNIQUE INDEX idx_funnel_daily_direct_unique
  ON public.funnel_daily(date, funnel)
  WHERE workshop_id IS NULL;

CREATE INDEX idx_funnel_daily_date ON public.funnel_daily(date DESC);
CREATE INDEX idx_funnel_daily_workshop ON public.funnel_daily(workshop_id);

ALTER TABLE public.funnel_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access to funnel_daily"
ON public.funnel_daily
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_funnel_daily_updated_at
BEFORE UPDATE ON public.funnel_daily
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
