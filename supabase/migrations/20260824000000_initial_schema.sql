create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  settings_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_niche text not null,
  location text not null,
  daily_limit integer not null default 200 check (daily_limit > 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  business_name text not null,
  website text,
  decision_maker_name text,
  decision_maker_email text,
  status text not null default 'discovered' check (status in ('discovered', 'primary_sent', 'followup_1', 'followup_2', 'followup_3', 'followup_4', 'followup_5', 'replied', 'unsubscribed')),
  lead_score integer check (lead_score between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  email_type text not null check (email_type in ('initial', 'followup_1', 'followup_2', 'followup_3', 'followup_4', 'followup_5')),
  sent_at timestamptz,
  opened boolean not null default false,
  replied boolean not null default false
);

create table if not exists public.pitch_drafts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  subject text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.leads enable row level security;
alter table public.email_logs enable row level security;
alter table public.pitch_drafts enable row level security;

create policy "Users can manage their profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can manage their campaigns" on public.campaigns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage campaign leads" on public.leads
  for all using (exists (select 1 from public.campaigns where campaigns.id = leads.campaign_id and campaigns.user_id = auth.uid()))
  with check (exists (select 1 from public.campaigns where campaigns.id = leads.campaign_id and campaigns.user_id = auth.uid()));

create policy "Users can manage lead email logs" on public.email_logs
  for all using (exists (select 1 from public.leads join public.campaigns on campaigns.id = leads.campaign_id where leads.id = email_logs.lead_id and campaigns.user_id = auth.uid()))
  with check (exists (select 1 from public.leads join public.campaigns on campaigns.id = leads.campaign_id where leads.id = email_logs.lead_id and campaigns.user_id = auth.uid()));

create policy "Users can manage lead pitch drafts" on public.pitch_drafts
  for all using (exists (select 1 from public.leads join public.campaigns on campaigns.id = leads.campaign_id where leads.id = pitch_drafts.lead_id and campaigns.user_id = auth.uid()))
  with check (exists (select 1 from public.leads join public.campaigns on campaigns.id = leads.campaign_id where leads.id = pitch_drafts.lead_id and campaigns.user_id = auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
