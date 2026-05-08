-- Workshop funnel backfill
-- Seeds the May 2 (closed) and May 16 (in-flight) workshop launches using
-- data tallied May 7-8, 2026.
--
-- Daily Meta ad spend + Meta-attributed conversions come from
-- HTA-Ad-Account exports (per-day breakdown).
-- Organic registrations and revenue events with imprecise dates are
-- lumped onto the workshop date row with a note explaining the lump.
-- Once daily entry begins (May 8+), this lumping does not propagate.

-- =============================================================
-- Workshops
-- =============================================================

INSERT INTO public.workshops (
  workshop_date, title,
  registration_window_start, registration_window_end,
  total_registrations, meta_attributed_registrations,
  attended,
  intensive_price, intensive_waitlist_mode,
  intensive_applications, intensive_declined, intensive_closes,
  notes
) VALUES (
  '2026-05-02',
  'Create Your Living Workspace',
  '2026-04-23', '2026-05-02',
  42, 19,
  22,
  1497.00, false,
  5, 1, 4,
  'Workshop #1. 16 stayed >70 min. 4 Intensive closes: Roger + Brittany (May 3), Gary (May 5), Michele (May 6 — also Futureproof t47). 1 declined (Lisi). Founding round at $1,497 with Custom Skills bonus. See knowledge/wiki/workshop-funnel-strategy.md.'
);

INSERT INTO public.workshops (
  workshop_date, title,
  registration_window_start, registration_window_end,
  total_registrations, meta_attributed_registrations,
  attended,
  intensive_price, intensive_waitlist_mode,
  intensive_applications, intensive_declined, intensive_closes,
  notes
) VALUES (
  '2026-05-16',
  'Create Your Living Workspace',
  '2026-05-03', '2026-05-16',
  13, 10,
  NULL,
  1997.00, true,
  0, 0, 0,
  'Workshop #2. State as of May 8: 13 registered, 10 Meta-attributed. Intensive in waitlist mode (1 founding spot remaining; G chose to cap round 1 at 4 buyers). Intensive price raised to $1,997 for round 2. YouTube Living Workspace concept video sent to list ad-hoc; pre-workshop Futureproof signups trending higher than May 2 post-workshop (see funnel_daily). Stripe metadata bug fixed mid-cycle (registrants no longer double-added to old + new MailerLite groups).'
);


-- =============================================================
-- funnel_daily — May 2 cohort (Apr 23 → May 2)
-- Ad spend and registrations_paid from Meta CSV daily breakdown.
-- =============================================================

WITH w AS (SELECT id FROM public.workshops WHERE workshop_date = '2026-05-02')
INSERT INTO public.funnel_daily (
  date, funnel, workshop_id,
  ad_spend, registrations_paid, registrations_organic,
  workshop_revenue,
  intensive_revenue, futureproof_revenue,
  futureproof_t27, futureproof_t47, futureproof_t333,
  notes
)
SELECT date, 'workshop', w.id, ad_spend, paid, organic,
       paid::numeric * 27.00,
       intensive_rev, futureproof_rev,
       fp27, fp47, fp333, note
FROM w, (VALUES
  -- date,        spend,   paid, organic, intensive_rev, fp_rev, fp27, fp47, fp333, note
  ('2026-04-23'::date,  39.72,  1, 0,    0.00,    0.00, 0, 0, 0, ''),
  ('2026-04-24'::date,  39.44,  3, 0,    0.00,    0.00, 0, 0, 0, ''),
  ('2026-04-25'::date,  25.67,  0, 0,    0.00,    0.00, 0, 0, 0, ''),
  ('2026-04-26'::date,  48.57,  1, 0,    0.00,    0.00, 0, 0, 0, ''),
  ('2026-04-27'::date,  75.38,  0, 0,    0.00,    0.00, 0, 0, 0, ''),
  ('2026-04-28'::date,  82.80,  3, 0,    0.00,    0.00, 0, 0, 0, ''),
  ('2026-04-29'::date, 122.66,  3, 0,    0.00,    0.00, 0, 0, 0, ''),
  ('2026-04-30'::date,  89.63,  1, 0,    0.00,    0.00, 0, 0, 0, ''),
  ('2026-05-01'::date,  99.62,  4, 0,    0.00,    0.00, 0, 0, 0, ''),
  -- Workshop day. Organic registrations (42 total - 19 paid = 23) lumped here
  -- because per-day organic split was not tracked. Workshop revenue includes
  -- $27 x 23 organic = $621 plus $27 x 3 paid same-day = $81 → $702.
  -- Intensive closes happened May 3, May 5, May 6 (4 closes x $1,497 = $5,988)
  -- and Futureproof attributed to May 2 cohort (1 t27 + 3 t47) lumped here per
  -- decision to not track per-day Intensive revenue in this backfill.
  -- Futureproof revenue: 1 x $27 + 3 x $47 = $168/mo (one-time view of the
  -- first month's revenue collected; recurring tracked separately in
  -- monthly_revenue / churn_events).
  ('2026-05-02'::date,  64.94,  3, 23,  5988.00,  168.00, 1, 3, 0,
    'Workshop day. Organic registrations (23) and all back-end revenue (4 Intensive closes May 3-6 totaling $5,988; 1 Futureproof t27 + 3 t47 totaling $168 first-month) lumped on workshop date per backfill decision. Going forward, daily entry will land each event on the actual day.')
) AS d(date, ad_spend, paid, organic, intensive_rev, futureproof_rev, fp27, fp47, fp333, note);


-- =============================================================
-- funnel_daily — May 16 cohort (May 3 → May 6, partial)
-- Daily entry takes over from May 7 onward.
-- =============================================================

WITH w AS (SELECT id FROM public.workshops WHERE workshop_date = '2026-05-16')
INSERT INTO public.funnel_daily (
  date, funnel, workshop_id,
  ad_spend, registrations_paid, registrations_organic,
  workshop_revenue,
  intensive_revenue, futureproof_revenue,
  futureproof_t27, futureproof_t47, futureproof_t333,
  notes
)
SELECT date, 'workshop', w.id, ad_spend, paid, organic,
       paid::numeric * 27.00,
       0.00, futureproof_rev,
       fp27, fp47, fp333, note
FROM w, (VALUES
  ('2026-05-03'::date, 116.30, 1, 0,    0.00, 0, 0, 0, ''),
  ('2026-05-04'::date, 117.86, 5, 0,    0.00, 0, 0, 0, ''),
  ('2026-05-05'::date, 113.78, 3, 0,    0.00, 0, 0, 0, ''),
  -- Organic regs (13 total - 10 paid = 3) and all Futureproof signups
  -- lumped on May 6 because per-day signup dates were not captured during
  -- the YouTube concept-video send. Going forward this won't happen.
  -- Futureproof: 2 t27 + 3 t47 + 2 t333 = 2*$27 + 3*$47 + 2*$333 = $861.
  -- Workshop revenue $81 = $27 x 3 organic regs.
  ('2026-05-06'::date, 120.05, 1, 3,  861.00, 2, 3, 2,
    'YouTube concept video drove pre-workshop Futureproof signups in this cycle. Organic regs + all Futureproof signups May 3-6 lumped here per backfill decision (per-day dates not tracked during ad-hoc video send). 2 t333 annual = first time the workshop funnel produced annual buyers; documented as a strong signal in knowledge/wiki/LOG.md.')
) AS d(date, ad_spend, paid, organic, futureproof_rev, fp27, fp47, fp333, note);
