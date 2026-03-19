-- Migration 013: Fix infinite RLS recursion between units and leases
--
-- The cycle:
--   units → tenant_view_own_unit policy → queries leases
--   leases → landlord_manage_leases policy → queries units  ← cycle!
--
-- Fix: use SECURITY DEFINER functions that bypass RLS to break the cycle.

-- Helper: get landlord_id for a building (bypasses RLS)
CREATE OR REPLACE FUNCTION fn_get_building_landlord(bid uuid)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT landlord_id FROM buildings WHERE id = bid;
$$;

-- Helper: check if a tenant has a lease for a unit (bypasses RLS)
CREATE OR REPLACE FUNCTION fn_tenant_has_unit_lease(p_tenant_id uuid, p_unit_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM leases WHERE unit_id = p_unit_id AND tenant_id = p_tenant_id);
$$;

-- Helper: get landlord for a unit via its building (bypasses RLS)
CREATE OR REPLACE FUNCTION fn_get_unit_landlord(p_unit_id uuid)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT b.landlord_id FROM units u JOIN buildings b ON b.id = u.building_id WHERE u.id = p_unit_id;
$$;

-- Fix units policies
DROP POLICY IF EXISTS "landlord_own_units" ON units;
DROP POLICY IF EXISTS "tenant_view_own_unit" ON units;

CREATE POLICY "landlord_own_units" ON units FOR ALL
  USING (fn_get_building_landlord(building_id) = auth.uid());

CREATE POLICY "tenant_view_own_unit" ON units FOR SELECT
  USING (fn_tenant_has_unit_lease(auth.uid(), id));

-- Fix leases policy (also queries units — the other side of the cycle)
DROP POLICY IF EXISTS "landlord_manage_leases" ON leases;

CREATE POLICY "landlord_manage_leases" ON leases FOR ALL
  USING (fn_get_unit_landlord(unit_id) = auth.uid());
