create materialized view building_analytics as
select
  b.id as building_id,
  b.name,
  count(distinct u.id) as total_units,
  count(distinct u.id) filter (where u.occupied = true) as occupied_units,
  coalesce(sum(le.amount) filter (where le.type = 'rent' and le.paid_at is not null), 0) as collected_rent,
  count(distinct mt.id) filter (where mt.status = 'open') as open_tickets
from buildings b
left join units u on u.building_id = b.id
left join leases l on l.unit_id = u.id and l.status = 'active'
left join ledger_entries le on le.lease_id = l.id
left join maintenance_tickets mt on mt.unit_id = u.id
group by b.id, b.name;

-- Refresh materialized view every hour via pg_cron
select cron.schedule('refresh-analytics', '0 * * * *', 'refresh materialized view building_analytics');
