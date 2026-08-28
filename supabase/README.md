# Supabase backend

The migrations in `migrations/` establish the Phase 1 data model, indexes, grants, RLS policies, safe member directory projection, private Storage buckets and protected atomic workflows.

Members still have no direct browser-write path to the point ledger. Membership activation, claim approval, referral qualification, event awards and reward deductions/refunds are exposed only through authenticated functions that validate the caller and run atomically.

Before production:

1. Apply migrations through the Supabase CLI rather than recreating schema in the dashboard.
2. Add pgTAP/RLS tests for visitor, member A, member B, admin and suspended-member behavior.
3. Seed the two reward definitions and configurable membership plan.
4. Create the first super admin through a controlled server-side/bootstrap procedure.
5. Confirm directory fields, evidence file limits, membership term behavior and reward eligibility with the owner.

Do not put a Supabase secret or service-role key in this repository or any browser configuration.
