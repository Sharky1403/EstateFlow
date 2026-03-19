import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Protect with a shared secret
  const cronSecret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date()
  const currentYear = today.getUTCFullYear()
  const currentMonth = today.getUTCMonth() + 1 // 1-based

  // Fetch all active leases with landlord's late fee config
  const { data: leases, error } = await admin
    .from('leases')
    .select('id, monthly_rent, tenant_id, unit_id, units(buildings(landlord_id))')
    .eq('status', 'active')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let applied = 0

  for (const lease of leases ?? []) {
    const landlordId = (lease as any).units?.buildings?.landlord_id
    if (!landlordId) continue

    // Get this landlord's late fee config
    const { data: config } = await admin
      .from('late_fee_config')
      .select('grace_period_days, fee_type, fee_value')
      .eq('landlord_id', landlordId)
      .single()

    const graceDays = config?.grace_period_days ?? 5
    const graceDateThisMonth = new Date(Date.UTC(currentYear, currentMonth - 1, graceDays))

    // Only apply late fee after grace period
    if (today <= graceDateThisMonth) continue

    // Check if rent was paid this month
    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
    const nextMonthStart = currentMonth === 12
      ? `${currentYear + 1}-01-01`
      : `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`

    const { data: rentPaid } = await admin
      .from('ledger_entries')
      .select('id')
      .eq('lease_id', lease.id)
      .eq('type', 'rent')
      .gte('paid_at', monthStart)
      .lt('paid_at', nextMonthStart)
      .limit(1)

    if (rentPaid && rentPaid.length > 0) continue // Rent was paid — skip

    // Check if late fee already applied this month (idempotency)
    const { data: existingFee } = await admin
      .from('ledger_entries')
      .select('id')
      .eq('lease_id', lease.id)
      .eq('type', 'late_fee')
      .gte('created_at', monthStart)
      .lt('created_at', nextMonthStart)
      .limit(1)

    if (existingFee && existingFee.length > 0) continue // Already applied — skip

    // Calculate fee amount
    const feeType = config?.fee_type ?? 'percent'
    const feeValue = Number(config?.fee_value ?? 5)
    const monthlyRent = Number(lease.monthly_rent)
    const amount = feeType === 'percent'
      ? Math.round((monthlyRent * (feeValue / 100)) * 100) / 100
      : feeValue

    // Insert late fee ledger entry
    await admin.from('ledger_entries').insert({
      lease_id: lease.id,
      type: 'late_fee',
      amount,
      bucket: 'revenue',
      description: `Late fee for ${new Date(Date.UTC(currentYear, currentMonth - 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })} (${feeType === 'percent' ? `${feeValue}%` : `$${feeValue} fixed`})`,
    })

    applied++
  }

  return NextResponse.json({ ok: true, applied })
}
