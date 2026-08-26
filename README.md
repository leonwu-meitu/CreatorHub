# CreatorHub

Production-oriented Creator Pool portal for Meitu, BeautyCam, and Wink. It includes a public application site, Creator workspace, Team review workspace, campaign management, submissions, rewards, payment forms, profiles, app-expansion requests, and VIP streak requests.

Production: [creator-pool-hub.meitu-creatorhub.workers.dev](https://creator-pool-hub.meitu-creatorhub.workers.dev)

## Architecture

- Next.js/Vinext frontend and Cloudflare Worker runtime
- Supabase Auth with Google OAuth
- Supabase Postgres with Row Level Security
- Supabase Storage for private analytics evidence
- Supabase Realtime for cross-session portal updates
- Supabase Edge Function for server-side AI analytics extraction

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

Application decision emails:

1. Enable Gmail API in a dedicated Google Cloud project and authorize only `gmail.send` for the sender mailbox.
2. Add `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER_EMAIL`, `GMAIL_SENDER_NAME`, and `CREATORHUB_URL` as Supabase Edge Function secrets.
3. Apply `supabase/migrations/20260820090000_application_decision_email.sql`.
4. Deploy `supabase/functions/application-decision-email` with JWT verification enabled.

The Team's final Accept or Decline action remains saved if Gmail is temporarily unavailable. Delivery attempts and errors are recorded on the application, and a successfully delivered decision is not sent twice.

AI analytics extraction:

1. Apply `supabase/migrations/20260826153000_ai_submission_analytics.sql`.
2. Store `OPENAI_API_KEY` as a Supabase Edge Function secret. Never put it in `.env.local`, GitHub, or a `NEXT_PUBLIC_*` variable.
3. Optionally set `OPENAI_ANALYTICS_MODEL`; the default is the pinned `gpt-4.1-mini-2025-04-14` snapshot.
4. Deploy `supabase/functions/analyze-submission-analytics` with JWT verification enabled.

The function checks the signed-in user, confirms ownership or Team access, downloads evidence from the private bucket, extracts views and engagement components with a strict schema, and lets Postgres calculate the final rate. AI results only prepare the Team review; they never qualify a post or create a reward automatically. OpenAI API usage is billed separately and should be monitored with project spend limits.

## Data and privacy behavior

- Creator applications remain pending until a Team member accepts or declines them.
- Accepted applications automatically grant Creator access; declined applications store the reason shown to the Creator.
- Analytics screenshots are private and use signed URLs.
- AI requests use `store: false`; the API key and private Storage access remain server-side.
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
- App expansion review and three-post campaign limit tested
- AI extraction tested with TikTok, Instagram, Threads, unreadable, and incorrect-platform screenshots
- Supabase redirect URLs point to the final subdomain
- Cloudflare custom subdomain and HTTPS active
- `npm run check` passes on the release commit

Social-media APIs can be added later. The current AI extractor is an assistive, server-side step and the Team remains the final verifier.
