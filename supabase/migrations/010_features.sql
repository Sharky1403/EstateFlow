-- ============================================================
-- Migration 010: All missing spec features
-- ============================================================

-- Feature 10: Fix maintenance urgency constraint (add 'high')
alter table maintenance_tickets
  drop constraint if exists maintenance_tickets_urgency_check;
alter table maintenance_tickets
  add constraint maintenance_tickets_urgency_check
  check (urgency in ('emergency', 'high', 'routine'));

-- Also add contractor_id column if not present (from migration 008)
alter table maintenance_tickets
  add column if not exists contractor_id uuid references profiles(id);

-- Feature 5: Lease break fee fields
alter table leases
  add column if not exists break_fee numeric default 0,
  add column if not exists break_fee_description text;

-- Feature 8: Track when expiry alerts were sent
alter table leases
  add column if not exists expiry_alert_sent_at timestamptz;

-- Feature 4: Auto-pay fields on profiles
alter table profiles
  add column if not exists autopay_enabled boolean default false,
  add column if not exists stripe_payment_method_id text;

-- Feature 9: Move-in inspection reports
create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references leases(id),
  created_by uuid not null references profiles(id),
  inspection_date date not null,
  rooms jsonb not null default '[]',
  overall_notes text,
  created_at timestamptz default now()
);

alter table inspections enable row level security;

create policy "landlord_manage_inspections" on inspections for all
  using (created_by = auth.uid());

create policy "tenant_view_own_inspection" on inspections for select
  using (exists (
    select 1 from leases l where l.id = inspections.lease_id and l.tenant_id = auth.uid()
  ));

-- Feature 6: Allow landlords to read contractor insurance records
create policy "landlord_view_contractor_insurance" on contractor_insurance
  for select using (true);

-- Feature 7: RLS on notification_read_receipts
alter table notification_read_receipts enable row level security;

create policy "tenant_own_read_receipts" on notification_read_receipts
  for all using (tenant_id = auth.uid());

create policy "landlord_view_read_receipts" on notification_read_receipts
  for select using (
    exists (
      select 1 from announcements a
      where a.id = notification_read_receipts.announcement_id
        and a.landlord_id = auth.uid()
    )
  );

-- Allow landlords to update maintenance tickets (assign contractor)
create policy "landlord_update_tickets" on maintenance_tickets for update
  using (exists (select 1 from units u join buildings b on b.id = u.building_id
    where u.id = maintenance_tickets.unit_id and b.landlord_id = auth.uid()));
