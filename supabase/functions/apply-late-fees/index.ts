import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: leases } = await supabase
    .from('leases')
    .select('id, monthly_rent, tenant_id, units(buildings(landlord_id))')
    .eq('status', 'active')

  let applied = 0
  for (const lease of leases ?? []) {
    const landlordId = (lease.units as any)?.buildings?.landlord_id
    const { data: config } = await supabase
      .from('late_fee_config')
      .select('*')
      .eq('landlord_id', landlordId)
      .single()

    if (!config) continue

    const today = new Date().getDate()
    const graceDue = config.grace_period_days + 1
    if (today !== graceDue) continue

    const { count } = await supabase
      .from('ledger_entries')
      .select('*', { count: 'exact', head: true })
      .eq('lease_id', lease.id)
      .eq('type', 'rent')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

    if ((count ?? 0) === 0) {
      const feeAmount = config.fee_type === 'percent'
        ? (lease.monthly_rent * config.fee_value) / 100
        : config.fee_value

      await supabase.from('ledger_entries').insert({
        lease_id: lease.id,
        type: 'late_fee',
        amount: feeAmount,
        bucket: 'revenue',
        description: `Late fee applied — ${config.fee_type === 'percent' ? config.fee_value + '%' : '$' + config.fee_value}`,
      })
      applied++
    }
  }

  return new Response(JSON.stringify({ applied }), { headers: { 'Content-Type': 'application/json' } })
})
