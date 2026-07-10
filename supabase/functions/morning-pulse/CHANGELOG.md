# morning-pulse — Response Schema Changelog

Every response includes `_meta.schema_version`. Bump the version on any change
to the response shape (added/renamed/removed keys, changed value types, new
aggregations). Consumers should assert on `schema_version` and fail loudly
when it changes unexpectedly.

## 2026-07-10
- Added top-level `_meta` block: `schema_version`, `tables_exposed`,
  `rows_returned` (per table), `rows_available` (per table, from a count
  query), and `limits_applied` (per table). Consumers can now detect
  truncation instead of silently reporting on a partial slice.
- Added `ad_activity.all_workshops`: full workshops list with per-workshop
  `status` (upcoming | live | closed) and a `computed` block sourced from
  `funnel_daily` (total_registrations, registrations_paid/organic,
  total_ad_spend, cpa_paid, cpa_blended, workshop_revenue,
  intensive_revenue, futureproof_revenue, futureproof_signups_by_tier).
  Enables workshop-over-workshop comparison.
- Dropped stale `workshops.total_registrations` column (see schema
  migration same day). All registration counts now come from
  `funnel_daily` via the `computed` block above.
- Corrected stored `workshops.intensive_price` from $1,997 → $3,000 for
  affected rows.

## 2026-07-09 (previous, unversioned)
- Added `trial_cohorts` section: `recent` (all rows) plus `totals` with
  maturity-gated `day7_conversion_rate` and `day30_retention_rate`
  (immature cohorts excluded from denominators; `null` when no cohort
  has matured). `cac_per_paid_trial` returns `null` when `day7_paid` is 0.
- Added `safe()` wrapper around every table fetch so a single query
  failure no longer 500s the whole endpoint; failures surface in the
  top-level `errors` array.

## Earlier
- Response was unversioned. `daily_acquisitions` was demoted from a
  top-level key to `ad_activity.direct_skool_legacy_recent` without a
  version bump — downstream consumer kept reading the dead key for
  weeks. That silent-drift incident is the reason `_meta.schema_version`
  and this changelog exist.
