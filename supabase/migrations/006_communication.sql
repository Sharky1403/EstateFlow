create table messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references maintenance_tickets(id),
  sender_id uuid not null references profiles(id),
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references profiles(id),
  building_id uuid not null references buildings(id),
  body text not null,
  sent_via text[] default '{}',
  created_at timestamptz default now()
);

create table notification_read_receipts (
  announcement_id uuid references announcements(id),
  tenant_id uuid references profiles(id),
  read_at timestamptz,
  primary key (announcement_id, tenant_id)
);

alter table messages enable row level security;
alter table announcements enable row level security;

create policy "ticket_participants_messages" on messages for all
  using (sender_id = auth.uid() or
    exists (select 1 from maintenance_tickets mt where mt.id = messages.ticket_id and mt.tenant_id = auth.uid()));

create policy "landlord_own_announcements" on announcements for all using (landlord_id = auth.uid());
create policy "tenant_view_announcements" on announcements for select
  using (exists (select 1 from leases l join units u on u.id = l.unit_id
    where u.building_id = announcements.building_id and l.tenant_id = auth.uid()));
