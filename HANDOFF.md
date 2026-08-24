# ACE SCOUTER Handoff

## Purpose

ACE SCOUTER is an AI-powered B2B lead prospecting and outreach command center. It is intended to discover target businesses, enrich decision-makers, generate personalized pitches, run a primary email plus exactly five follow-ups, stop sequences when a recipient replies, and provide CRM/analytics views.

This file is the source of truth for a new chat. Update it whenever implementation, infrastructure, configuration, or decisions change.

## Workspace

- Local path: `C:\Users\DELL\Desktop\webappacescouter`
- GitHub: https://github.com/bestcreativity/ace-scouter
- Branch: `main`
- Latest known commit: `50afc7a Add Supabase authentication entrypoint`
- Remote: `origin` points to the GitHub repository above
- Local dev URL: http://localhost:5173/

## Current Application

The app is a Vite + React single-page dashboard using `lucide-react` icons and custom CSS.

Implemented in `src/main.jsx` and `src/styles.css`:

- Dark, dense SaaS command center visual system
- Responsive desktop/mobile layout
- Collapsible sidebar navigation
- Overview dashboard with metrics, performance chart, live activity, lead pipeline, pitch queue, and priority-lead table
- Lead search filtering
- Campaign builder modal
- Campaign fields for niche, location, daily limit, and sequence delay
- Discovery toggles for Google Places, corporate/web crawler, and LinkedIn enrichment
- AI pitch approval toggle
- Placeholder views for Campaigns, Lead CRM, Pitch queue, and Integrations
- Toast feedback for key interactions

Authentication now uses the Supabase client in `src/lib/supabase.js`:

- Email/password sign-in
- Email/password account creation
- Authenticated session loading and auth-state updates
- Dashboard gated behind an active Supabase session
- Sign-out from the profile row
- Missing Supabase environment variables show a configuration message

The dashboard data is still mock data. Authentication is real, but campaigns, leads, analytics, activity, and pitch queue records are not yet loaded from Supabase.

## Supabase

Project:

- Organization: `leadradar`
- Project name: `ace-scouter`
- Project ref: `qrnfjeoqwqpgpsrvskvh`
- Project URL: `https://qrnfjeoqwqpgpsrvskvh.supabase.co`
- Region: West EU / Ireland (`eu-west-1`)
- Plan: Free
- Dashboard: https://supabase.com/dashboard/project/qrnfjeoqwqpgpsrvskvh

Live database state was verified in Supabase SQL Editor. These tables exist:

- `public.profiles`
- `public.campaigns`
- `public.leads`
- `public.email_logs`

The migration also enables RLS, creates user-scoped policies, and creates an `auth.users` trigger that inserts a profile row for new users.

Migration source:

- `supabase/migrations/20260824000000_initial_schema.sql`

Important: the SQL editor migration was applied manually and verified with an information-schema query returning all four tables. The project does not currently have a migration history workflow configured through the Supabase CLI.

## Local Environment

- `src/lib/supabase.js` initializes the client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` when both are present.
- `.env` exists locally and contains the user-entered Supabase URL and anon key. It is ignored by Git and must never be committed or pasted into chat.
- `.env.example` is tracked and contains only placeholders plus the project URL.
- `.gitignore` ignores `node_modules/`, `dist/`, `.env`, and `.env.*` while allowing `.env.example`.

To run locally:

```powershell
npm install
npm run dev
```

To validate a production build:

```powershell
npm run build
```

Last known build result: successful with Vite.

## GitHub

The repository was created under the authenticated GitHub account `bestcreativity` and is public unless changed in GitHub settings. The app and Supabase foundation have been pushed to `main`.

Supabase's project-level GitHub integration was attempted from Project Settings -> Integrations but did not open a repository selector or complete authorization. The repository is still usable independently through Git.

## Security Notes

- The database password entered during project creation was visible in a prior browser/tool context and must be treated as compromised.
- Supabase Project Settings -> Database showed the Reset password button disabled, indicating the current account lacks the required project-owner permission. Rotate it when owner/admin access is available.
- Do not put database passwords, service-role keys, or other secrets in GitHub, `.env.example`, source files, or chat.
- The anon key is intended for client-side Supabase use, but still keep it in local/deployment environment configuration rather than committing it.

## Remaining Work, In Order

1. Rotate the compromised database password with project-owner/admin permission.
2. Decide whether to complete Supabase GitHub integration; it is optional for the current Git-based workflow.
3. Add the Supabase anon key to deployment environment variables.
4. Configure Supabase email confirmation and Google OAuth redirect settings as needed.
5. Replace mock dashboard data with authenticated Supabase queries and mutations.
6. Add campaign creation persistence from the campaign modal.
7. Add CRM table/Kanban interactions and pitch approval persistence.
8. Add server-side/background jobs for discovery, enrichment, email batching, and exactly five follow-ups.
9. Add the `/api/webhooks/email-status` handler and stop follow-ups on replies.
10. Add provider integrations for Google Places, Apollo, Hunter, and Resend/SendGrid using server-only secrets.
11. Add automated tests for auth, RLS, campaign creation, lead status transitions, follow-up halting, and webhook processing.
12. Deploy the frontend and configure production environment variables.

## Working Rules For Future Chats

- Read this file first and update it in the same change whenever the project state changes.
- Preserve existing user changes and inspect `package.json`, `.env.example`, and Git status before edits.
- Never reveal or commit values from `.env`.
- Keep schema changes in `supabase/migrations/` and apply/verify them in Supabase.
- Run `npm run build` after frontend or dependency changes.
- Push completed changes to `main` unless the user requests another branch.
