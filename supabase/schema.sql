create extension if not exists pgcrypto;

create table if not exists public.kyc_applicants (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique not null,
  external_user_id text not null,
  inquiry_id text,
  applicant_id text,
  level_name text,
  status text,
  review_status text,
  review_answer text,
  full_name text,
  country text,
  accreditation text,
  document_urls jsonb,
  submission_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  wallet_address text,
  event_type text not null,
  source text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists kyc_applicants_wallet_address_idx on public.kyc_applicants (wallet_address);
create index if not exists audit_events_wallet_address_idx on public.audit_events (wallet_address);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_kyc_applicants_updated_at
before update on public.kyc_applicants
for each row execute function public.set_updated_at();
