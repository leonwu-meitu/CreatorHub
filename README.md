# Creator Pool Hub

A full-stack MVP for recruiting, briefing, reviewing, and rewarding creators across Meitu, BeautyCam, and Wink in Indonesia.

## Product surfaces

- Public Bahasa Indonesia recruitment site and two-step application form
- Creator workspace for tasks, submissions, rewards, performance, and leaderboards
- Internal workspace for applications, creator operations, campaign tasks, AI-assisted human review, reward approval, CSV export, and impact reporting
- D1-backed application, task, submission, reward, and audit records
- R2 evidence upload endpoint with image type and 8 MB validation

All AI recommendations in the interface are advisory. Approval, revision, and reward decisions remain with a human reviewer.

## Local setup

Requirements: Node.js 22.13 or newer.

1. Run `npm install`.
2. Run `npm run db:generate` after schema changes.
3. Run `npm run dev` and open the printed local URL.
4. Run `npm test` before deployment.

The local preview uses realistic demonstration records. Mutations are written to the local D1 database when available.

## Demo walkthrough

1. Start in Team / Overview and open an item in the submission queue.
2. Inspect the AI checklist and evidence comparison, then approve or request revision.
3. Open Rewards, approve a calculated reward, and export approved rows to CSV.
4. Create and publish a new campaign task.
5. Switch to Creator to join a task, submit evidence, view rewards, and inspect the leaderboard.
6. Open Public site and submit a creator application.

## Manual QA checklist

- Switch between Team, Creator, and Public surfaces.
- Verify application, task, and submission forms validate required fields.
- Approve a submission and confirm a pending reward is created.
- Approve and export a reward; confirm the CSV contains approved rows only.
- Confirm status badges include readable text and all controls have visible keyboard focus.
- Check the layout at desktop, tablet, and mobile widths.
- Confirm `/api/platform` returns JSON and creates an audit row for each write.
- Confirm `/api/uploads` rejects unsupported types and files over 8 MB.

## Known MVP limitations

- External social network APIs, scraping, WhatsApp automation, and direct payments are intentionally excluded.
- AI review content is represented with deterministic demonstration results until an OpenAI runtime key and production job runner are connected.
- Hosted access is owner-only for this first deployment. Public recruitment should be moved to a separate public access policy before a real pilot.

## Future roadmap

Production email delivery, scheduled measurement jobs, reviewer assignment, granular team roles, configurable AI prompts, payment reconciliation, and multi-language expansion.
