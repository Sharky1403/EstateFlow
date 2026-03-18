-- Add kyc_status and logo_url to profiles
alter table profiles
  add column if not exists kyc_status text check (kyc_status in ('pending','approved','rejected')) default 'pending',
  add column if not exists logo_url text;
