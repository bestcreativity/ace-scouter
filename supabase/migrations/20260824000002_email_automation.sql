alter table public.email_logs
  add column if not exists provider_message_id text unique,
  add column if not exists event_type text,
  add column if not exists event_at timestamptz;

alter table public.leads
  add column if not exists email_verified boolean not null default false,
  add column if not exists sequence_halted boolean not null default false,
  add column if not exists unsubscribed_at timestamptz;

create index if not exists email_logs_provider_message_id_idx on public.email_logs(provider_message_id);
create index if not exists leads_sequence_halted_idx on public.leads(sequence_halted);
