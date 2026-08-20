# CreatorHub

Production-oriented Creator Pool portal for Meitu, BeautyCam, and Wink. It includes a public application site, Creator workspace, Team review workspace, campaign management, submissions, rewards, payment forms, profiles, app-expansion requests, and VIP streak requests.

Production: [creator-pool-hub.meitu-creatorhub.workers.dev](https://creator-pool-hub.meitu-creatorhub.workers.dev)

## Architecture

- Next.js/Vinext frontend and Cloudflare Worker runtime
- Supabase Auth with Google OAuth
- Supabase Postgres with Row Level Security
- Supabase Storage for public profile pictures and private analytics evidence
- Supabase Realtime for cross-session portal updates

The browser only receives the Supabase publishable key. Never add a service-role key to this repository or to a `NEXT_PUBLIC_*` variable.

## Local development

Requirements: Node.js 22.13 or newer.

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL printed by Vinext.

Use `npm run check` before pushing. It runs TypeScript, ESLint, the production build, and the product contract test.

## Supabase setup

Run the SQL files in `supabase/` in numeric order. Existing projects that already ran migrations 001, 003, 004, and 005 can run `006_production_completion.sql`; it safely restores the missing application table and adds the final production tables, policies, Storage buckets, guard trigger, and Realtime publication.

Authentication configuration:

1. Enable Google in **Authentication → Providers**.
2. Add the local, staging, and production callback URLs to **Authentication → URL Configuration**.
3. Keep new users as `creator` with `application_status = 'in_review'`.
4. Promote Team members only in the backend:

```sql
update public.profiles
set role = 'marketing_admin', application_status = 'accepted'
where email = 'team@example.com';
```

To give a Team member access to both portals, set `can_access_creator = true` after migration 006.

## Data and privacy behavior

- Creator applications remain pending until a Team member accepts or declines them.
- Accepted applications automatically grant Creator access; declined applications store the reason shown to the Creator.
- Analytics screenshots are private and use signed URLs.
- When Team makes the final Qualified or Not Qualified decision, the screenshot is deleted while verified views, total engagement, calculated engagement rate, and decision reason remain as structured records.
- Creators cannot modify verified analytics or final decisions because a database trigger enforces the boundary.
- Rewards are created only from Qualified submissions and payment-form status is managed by Team.

## Deployment

The generated Worker can be deployed independently of ChatGPT:

```bash
npm run deploy:cloudflare
```

This builds the application and deploys `dist/server/wrangler.json` with the static assets in `dist/client`. Authenticate Wrangler with the company Cloudflare account first, then attach the final subdomain in Cloudflare. Add the final origin and `/auth/callback` URL to both Supabase and Google OAuth before public launch.

The `.openai/hosting.json` project remains available for staging previews, but production data and files are owned by the Supabase project rather than D1/R2.

## Launch checklist

- All migrations applied successfully
- Google OAuth tested with a new Creator and a Team account
- Creator application → Accepted/Declined flow tested
- Campaign create/join/edit flow tested
- Submission upload → review → screenshot deletion tested
- Qualified submission → reward → payment-form status tested
- Profile and avatar changes verified in both portals
- App expansion and VIP streak review tested
- Supabase redirect URLs point to the final subdomain
- Cloudflare custom subdomain and HTTPS active
- `npm run check` passes on the release commit

Social-media APIs and an AI/OCR analytics extractor can be added later behind server-side jobs. The current production path intentionally keeps the Team as the final verifier and avoids paid AI token usage.
