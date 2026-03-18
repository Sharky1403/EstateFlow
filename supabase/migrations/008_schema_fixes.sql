-- Add missing columns to profiles
alter table profiles add column if not exists email text;
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists specialties text[];

-- Add contractor_id to maintenance_tickets (used by assignment flow)
alter table maintenance_tickets add column if not exists contractor_id uuid references profiles(id);

-- Allow landlords to update tickets (for assignment)
create policy "landlord_update_tickets" on maintenance_tickets for update
  using (exists (
    select 1 from units u join buildings b on b.id = u.building_id
    where u.id = maintenance_tickets.unit_id and b.landlord_id = auth.uid()
  ));

-- Allow tenants to update their own profile (for stripe_customer_id, etc.)
create policy "users_update_own_profile" on profiles for update using (id = auth.uid());
