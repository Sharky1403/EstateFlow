-- Migration 016: Add invited_unit_id to profiles
-- This column tracks which unit a tenant was invited to apply for.
-- Used by: invite flow, verifications page, tenant application page, dashboard.

alter table profiles
  add column if not exists invited_unit_id uuid references units(id) on delete set null;

-- Index for fast landlord lookup on verifications page
create index if not exists profiles_invited_unit_id_idx on profiles(invited_unit_id);
