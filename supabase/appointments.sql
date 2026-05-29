create table if not exists public.appointments (
  id text primary key,
  patient_name text not null,
  patient_email text not null,
  patient_phone text not null,
  treatment_id text not null,
  therapist_id text not null,
  date date not null,
  time text not null,
  status text not null check (status in ('pending', 'confirmed', 'cancelled')),
  notes text,
  wants_earlier boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments
  add column if not exists wants_earlier boolean not null default false;

create unique index if not exists appointments_active_slot_idx
  on public.appointments (date, time, therapist_id)
  where status in ('pending', 'confirmed');

create index if not exists appointments_status_idx
  on public.appointments (status, date, time);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists appointments_set_updated_at on public.appointments;

create trigger appointments_set_updated_at
before update on public.appointments
for each row
execute function public.set_updated_at();

alter table public.appointments enable row level security;

drop policy if exists "appointments are managed by server" on public.appointments;

create policy "appointments are managed by server"
on public.appointments
for all
using (false)
with check (false);
