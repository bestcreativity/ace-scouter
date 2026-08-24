# ACE SCOUTER Handoff

## Purpose

ACE SCOUTER is an AI-powered B2B lead prospecting and outreach command center. It is intended to discover target businesses, enrich decision-makers, generate personalized pitches, run a primary email plus exactly five follow-ups, stop sequences when a recipient replies, and provide CRM/analytics views.

This file is the source of truth for a new chat. Update it whenever implementation, infrastructure, configuration, or decisions change.

## Workspace

- Local path: `C:\Users\DELL\Desktop\webappacescouter`
- GitHub: https://github.com/bestcreativity/ace-scouter
- Branch: `main`
- Latest known commit: `4bfaeae Add editable sender email settings`
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

Users can edit their outbound sender address in the Integrations screen. It is stored as `profiles.sending_email` and the email function reads that per-user value at send time, so it can be changed without redeploying. Apply `supabase/migrations/20260824000004_sender_email.sql` to add the live column. The configured address still must belong to a provider-verified sending domain.

The pitch queue implementation is in `src/main.jsx`: it generates deterministic personalized drafts from discovered lead data, stores them in `pitch_drafts`, and supports pending/approved/rejected review states. Migration `supabase/migrations/20260824000001_pitch_drafts.sql` has been applied to the live database and verified with an information-schema query.

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
- `public.pitch_drafts` (live and verified; use the separate `20260824000001_pitch_drafts.sql` migration)
- `profiles.sending_email` (live and verified; migration source `20260824000004_sender_email.sql`)

The migration also enables RLS, creates user-scoped policies, and creates an `auth.users` trigger that inserts a profile row for new users.

Migration source:

- `supabase/migrations/20260824000000_initial_schema.sql`

Important: the SQL editor migration was applied manually and verified with an information-schema query returning all four tables. The project does not currently have a migration history workflow configured through the Supabase CLI.

Email automation foundations are in `supabase/functions/`:

- `send-approved-draft/index.ts` sends one approved draft through Resend, only when the lead has a verified recipient email and the sequence is not halted.
- `email-status-webhook/index.ts` records provider events and halts a lead on reply, bounce, complaint, or unsubscribe. It requires the `x-webhook-secret` header to match `EMAIL_WEBHOOK_SECRET`.
- `supabase/migrations/20260824000002_email_automation.sql` adds provider message IDs, event fields, verified-email state, and sequence-halt state.

Required Supabase Function secrets are `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `EMAIL_WEBHOOK_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` (the latter is normally provided by the platform). Deploy with the Supabase CLI after linking the project; never place these in Vite variables or Git.

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
8. Apply `20260824000002_email_automation.sql` in Supabase SQL Editor.
9. Configure a verified Resend sending domain and Supabase Function secrets, then deploy both Edge Functions.
10. Add a scheduled worker for exactly five follow-ups, checking `sequence_halted` before every send.
11. Add automated tests for auth, RLS, campaign creation, lead status transitions, follow-up halting, and webhook processing.
12. Deploy the frontend and configure production environment variables.

Current deployment note: Vercel is not authenticated in the browser session. The deployed app showed the missing-environment message because Vercel did not have `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured at build time. Add both under Vercel Project Settings -> Environment Variables for Production, then redeploy. The local `.env` is not uploaded to Vercel.

## Working Rules For Future Chats

- Read this file first and update it in the same change whenever the project state changes.
- Preserve existing user changes and inspect `package.json`, `.env.example`, and Git status before edits.
- Never reveal or commit values from `.env`.
- Keep schema changes in `supabase/migrations/` and apply/verify them in Supabase.
- Run `npm run build` after frontend or dependency changes.
- Push completed changes to `main` unless the user requests another branch.
