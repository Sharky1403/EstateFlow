create table maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  tenant_id uuid not null references profiles(id),
  description text not null,
  photo_url text,
  voice_note_url text,
  urgency text check (urgency in ('emergency','routine')),
  category text check (category in ('plumbing','electrical','hvac','other')),
  status text not null default 'open' check (status in ('open','assigned','in_progress','complete')),
  created_at timestamptz default now()
);

create table work_orders (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references maintenance_tickets(id),
  contractor_id uuid not null references profiles(id),
  access_code text not null,
  completion_photo_url text,
  status text not null default 'sent' check (status in ('sent','accepted','complete'))
);

create table contractor_insurance (
  contractor_id uuid primary key references profiles(id),
  policy_document_url text not null,
  expiry_date date not null
);

alter table maintenance_tickets enable row level security;
alter table work_orders enable row level security;
alter table contractor_insurance enable row level security;

create policy "tenant_own_tickets" on maintenance_tickets for all using (tenant_id = auth.uid());
create policy "landlord_view_tickets" on maintenance_tickets for select
  using (exists (select 1 from units u join buildings b on b.id = u.building_id
    where u.id = maintenance_tickets.unit_id and b.landlord_id = auth.uid()));
create policy "contractor_own_orders" on work_orders for all using (contractor_id = auth.uid());
create policy "contractor_own_insurance" on contractor_insurance for all using (contractor_id = auth.uid());
