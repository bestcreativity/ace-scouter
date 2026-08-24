alter table public.profiles
  add column if not exists sending_email text;
