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

The pitch queue implementation is in `src/main.jsx`: it generates deterministic personalized drafts from discovered lead data, stores them in `pitch_drafts`, and supports pending/approved/rejected review states. Apply `supabase/migrations/20260824000001_pitch_drafts.sql` to the live database before using draft generation. Until then, the app tolerates a missing `pitch_drafts` table and shows an empty queue.

The dashboard now queries authenticated `campaigns`, `leads`, and `email_logs` records. Metrics, pipeline counts, reply rate, and priority leads are live. Empty and error states replace the former sample records. The campaign builder validates and persists an active campaign row.

Free scouting is now implemented in `src/main.jsx`: after campaign creation, the browser uses OpenStreetMap Nominatim to geocode the location and the public Overpass API to find named nearby businesses, then saves up to 10 leads with public website links when available. This is an MVP discovery path with public-service rate limits; it is not a substitute for paid Places or enrichment providers and does not discover verified decision-maker emails.

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
- `public.pitch_drafts` (pending application; use the separate `20260824000001_pitch_drafts.sql` migration)

The migration also enables RLS, creates user-scoped policies, and creates an `auth.users` trigger that inserts a profile row for new users.

Migration source:

- `supabase/migrations/20260824000000_initial_schema.sql`

Important: the SQL editor migration was applied manually and verified with an information-schema query returning all four tables. The project does not currently have a migration history workflow configured through the Supabase CLI.

## Local Environment

- `src/lib/supabase.js` initializes the client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` when both are present.
- `.env` exists locally and contains the user-entered Supabase URL and anon key. It is ignored by Git and must never be committed or pasted into chat.
- `.env.example` is tracked and contains only placeholders plus the project URL. If it ever contains a real key, sanitize it immediately and rotate the key if it was pushed publicly.
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
5. Apply the `pitch_drafts` table and policy from the updated migration in Supabase SQL Editor.
6. Add CRM table/Kanban interactions and pitch approval persistence.
7. Move free scouting behind a server-side worker or Edge Function and deduplicate results.
8. Add the `/api/webhooks/email-status` handler and stop follow-ups on replies.
9. Add provider integrations for Google Places, Apollo, Hunter, and Resend/SendGrid using server-only secrets.
10. Add automated tests for auth, RLS, campaign creation, lead status transitions, follow-up halting, and webhook processing.
11. Deploy the frontend and configure production environment variables.

Current deployment note: Vercel is not authenticated in the browser session. The deployed app showed the missing-environment message because Vercel did not have `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured at build time. Add both under Vercel Project Settings -> Environment Variables for Production, then redeploy. The local `.env` is not uploaded to Vercel.

## Working Rules For Future Chats

- Read this file first and update it in the same change whenever the project state changes.
- Preserve existing user changes and inspect `package.json`, `.env.example`, and Git status before edits.
- Never reveal or commit values from `.env`.
- Keep schema changes in `supabase/migrations/` and apply/verify them in Supabase.
- Run `npm run build` after frontend or dependency changes.
- Push completed changes to `main` unless the user requests another branch.
