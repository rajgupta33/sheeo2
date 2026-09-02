# Member portal deployment

The portal is designed to run at `https://members.sheeo-summit.com/portal/` while the public website remains at `https://sheeo-summit.com/`.

## Hosting and DNS

The public site currently uses GitHub Pages and the repository `CNAME` is `sheeo-summit.com`. GitHub Pages accepts only one custom domain per Pages site, so `members.sheeo-summit.com` must use a second static hosting project (recommended), a second GitHub Pages repository, or a DNS-provider reverse proxy. Do not add a second line to the existing `CNAME` file.

Recommended setup:

1. Create a second static-site project on Cloudflare Pages, Netlify, Vercel, or an equivalent provider and connect this repository.
2. Publish the repository root as-is; no build command is required.
3. Add `members.sheeo-summit.com` as that project's custom domain and enable HTTPS.
4. In the DNS zone, create the `members` CNAME requested by that provider. Remove conflicting `A`, `AAAA`, or `CNAME` records for `members` first.
5. Confirm that `https://members.sheeo-summit.com/` redirects to `https://members.sheeo-summit.com/portal/` and that the public apex domain remains unchanged.

The second deployment may contain the public files too, but host-aware routing sends its root directly into the portal and portal links send public actions back to the apex site.

## Supabase Auth

In Supabase Dashboard → Authentication → URL Configuration, set:

- Site URL: `https://members.sheeo-summit.com/portal/`
- Redirect URL: `https://members.sheeo-summit.com/portal/reset-password.html`

Keep any localhost preview URLs needed by development, but use exact production URLs. If a customized confirmation/reset email template uses `{{ .SiteURL }}`, confirm it produces the portal URL; templates intended to honor a per-request destination should use `{{ .RedirectTo }}`.

Apply the SQL migrations in `supabase/migrations/` in filename order before accepting live applications.

## Production verification

1. Open the public homepage and verify **Apply to Join** opens the application while **Member Login** opens the subdomain.
2. Submit a test application and confirm the auth user and pending application are both created.
3. Confirm the applicant email, sign in, and verify the pending status page appears.
4. Approve the application as an admin and verify the same account opens the member dashboard.
5. Request a password reset and verify the email returns to the subdomain reset page.
6. On a supported mobile browser, install the portal and launch it from the home screen.
7. With the browser offline, reload a previously visited portal route and confirm the app shell appears. Member data remains network-only by design.
