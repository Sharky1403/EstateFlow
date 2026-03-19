-- ============================================================
-- Migration 011: Spec gap fixes
-- ============================================================

-- 1. E-signature: allow tenants to sign (update) their own lease
-- signature_data column already exists in 003_leases.sql
create policy "tenant_sign_own_lease" on leases for update
  using (tenant_id = auth.uid())
  with check (tenant_id = auth.uid());

-- 2. Completion photo for maintenance tickets
alter table maintenance_tickets
  add column if not exists completion_photo_url text;

-- 3. Push notification subscriptions
create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "users_manage_own_subscriptions" on push_subscriptions
  for all using (user_id = auth.uid());

-- Allow landlords to read their tenants' subscriptions for broadcasting
create policy "landlord_read_tenant_subscriptions" on push_subscriptions
  for select using (
    exists (
      select 1 from leases l
        join units u on u.id = l.unit_id
        join buildings b on b.id = u.building_id
      where l.tenant_id = push_subscriptions.user_id
        and b.landlord_id = auth.uid()
    )
  );
