create table buildings (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  address text not null,
  created_at timestamptz default now()
);

create table units (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  floor_number int not null default 1,
  unit_number text not null,
  market_rent numeric not null default 0,
  actual_rent numeric not null default 0,
  occupied boolean not null default false,
  metadata jsonb default '{}'
);

alter table buildings enable row level security;
alter table units enable row level security;

create policy "landlord_own_buildings" on buildings for all
  using (landlord_id = auth.uid());

create policy "landlord_own_units" on units for all
  using (exists (select 1 from buildings b where b.id = units.building_id and b.landlord_id = auth.uid()));

create policy "tenant_view_own_unit" on units for select
  using (exists (select 1 from leases l where l.unit_id = units.id and l.tenant_id = auth.uid()));
