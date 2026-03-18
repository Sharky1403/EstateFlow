create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references leases(id),
  type text not null check (type in ('rent','late_fee','deposit','expense','lease_break_fee')),
  amount numeric not null,
  bucket text not null check (bucket in ('revenue','deposit_hold','expense')),
  paid_at timestamptz,
  description text,
  created_at timestamptz default now()
);

create table late_fee_config (
  landlord_id uuid primary key references profiles(id),
  grace_period_days int not null default 5,
  fee_type text not null check (fee_type in ('percent','fixed')),
  fee_value numeric not null default 5
);

alter table ledger_entries enable row level security;
alter table late_fee_config enable row level security;

create policy "tenant_view_own_ledger" on ledger_entries for select
  using (exists (select 1 from leases l where l.id = ledger_entries.lease_id and l.tenant_id = auth.uid()));

create policy "landlord_manage_ledger" on ledger_entries for all
  using (exists (
    select 1 from leases l join units u on u.id = l.unit_id join buildings b on b.id = u.building_id
    where l.id = ledger_entries.lease_id and b.landlord_id = auth.uid()
  ));

create policy "landlord_fee_config" on late_fee_config for all using (landlord_id = auth.uid());
