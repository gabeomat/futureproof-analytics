UPDATE public.funnel_daily
SET futureproof_revenue = (futureproof_t27 * 27) + (futureproof_t47 * 47) + (futureproof_t333 * 333)
WHERE futureproof_revenue <> (futureproof_t27 * 27) + (futureproof_t47 * 47) + (futureproof_t333 * 333);