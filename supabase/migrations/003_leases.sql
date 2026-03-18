create table leases (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  tenant_id uuid not null references profiles(id),
  start_date date not null,
  end_date date not null,
  monthly_rent numeric not null,
  clauses jsonb default '[]',
  pdf_url text,
  signed_at timestamptz,
  signature_data text,
  status text not null default 'draft' check (status in ('draft','active','expired','terminated')),
  created_at timestamptz default now()
);

alter table leases enable row level security;

create policy "tenant_own_lease" on leases for select
  using (tenant_id = auth.uid());

create policy "landlord_manage_leases" on leases for all
  using (exists (select 1 from units u join buildings b on b.id = u.building_id
    where u.id = leases.unit_id and b.landlord_id = auth.uid()));
