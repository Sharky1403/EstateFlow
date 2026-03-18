create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('landlord','tenant','contractor')),
  full_name text not null,
  avatar_url text,
  company_name text,
  company_logo_url text,
  phone text,
  id_document_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "users_own_profile" on profiles for all using (id = auth.uid());
create policy "landlords_view_tenants" on profiles for select using (true);
