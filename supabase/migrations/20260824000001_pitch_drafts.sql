create table if not exists public.pitch_drafts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  subject text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.pitch_drafts enable row level security;

create policy "Users can manage lead pitch drafts" on public.pitch_drafts
  for all using (exists (select 1 from public.leads join public.campaigns on campaigns.id = leads.campaign_id where leads.id = pitch_drafts.lead_id and campaigns.user_id = auth.uid()))
  with check (exists (select 1 from public.leads join public.campaigns on campaigns.id = leads.campaign_id where leads.id = pitch_drafts.lead_id and campaigns.user_id = auth.uid()));
