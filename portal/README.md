# SheEO Membership Portal

This directory contains the credential-independent Phase 0 member and admin portal scaffold described in the implementation specification.

## Preview

Serve the repository root with any static HTTP server and open `/portal/login.html`. While `MOCK_MODE` is `true`, any non-empty email/password combination opens a demo active-member session. Mock state lives only in JavaScript memory and resets on page reload.

Production uses `https://members.sheeo-summit.com/portal/`. See [DEPLOYMENT.md](DEPLOYMENT.md) for the required hosting, DNS, Supabase redirect, PWA and end-to-end checks.

## Connect Supabase

1. Apply both version-controlled migrations in filename order. They create the schema/RLS/Storage foundation first and the protected workflows second.
2. Create the first Super Admin through a controlled SQL/CLI bootstrap after the administrator has an Auth account.
3. Set `MOCK_MODE` to `false` in `/assets/js/config.js` only after the migrations succeed.
4. Confirm the production Site URL and redirect URLs in Supabase Auth.
5. Create/activate test memberships before using real member data.
6. Test with three separate accounts: member A, member B and admin.

Never add a service-role or secret key to this repository. The frontend may submit a claim or redemption request, but awarding points, activating memberships, approving claims, processing referrals, deducting/refunding rewards and changing admin roles must remain protected server-side operations.

## Current Phase 0 routes

- Member: login, password reset, membership status, dashboard, points, earn points/claims, directory, profile, referrals, rewards and membership.
- Admin: overview, members/applications, claims, referrals, reward fulfillment, events and audit log.

The frontend reads and writes through `/assets/js/api.js` so mock calls can be replaced without rewriting page presentation logic.
