import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/twilio'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const cronSecret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date()
  const in60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
  const todayStr = today.toISOString().split('T')[0]
  const in60Str = in60Days.toISOString().split('T')[0]

  // Find active leases expiring within 60 days where we haven't sent an alert recently
  const { data: leases, error } = await admin
    .from('leases')
    .select(`
      id, end_date, monthly_rent,
      profiles!tenant_id(full_name, phone),
      units(unit_number, buildings(name))
    `)
    .eq('status', 'active')
    .gte('end_date', todayStr)
    .lte('end_date', in60Str)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let alerted = 0

  for (const lease of leases ?? []) {
    // Skip if we already sent an alert in the last 30 days
    const { data: existingAlert } = await admin
      .from('leases')
      .select('expiry_alert_sent_at')
      .eq('id', lease.id)
      .single()

    if (existingAlert?.expiry_alert_sent_at) {
      const lastSent = new Date(existingAlert.expiry_alert_sent_at)
      const daysSinceSent = (today.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceSent < 30) continue
    }

    const tenant = (lease as any).profiles
    const unit = (lease as any).units
    const daysLeft = Math.ceil((new Date(lease.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const buildingName = unit?.buildings?.name ?? 'your property'
    const unitNumber = unit?.unit_number ? ` Unit ${unit.unit_number}` : ''

    // Send SMS if tenant has a phone number
    if (tenant?.phone) {
      try {
        await sendSMS(
          tenant.phone,
          `Hi ${tenant.full_name ?? 'Tenant'}, your lease at ${buildingName}${unitNumber} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${lease.end_date}). Please contact your landlord to renew or plan your move-out. — EstateFlow`
        )
      } catch (smsErr) {
        console.error(`SMS failed for lease ${lease.id}:`, smsErr)
      }
    }

    // Mark alert as sent
    await admin
      .from('leases')
      .update({ expiry_alert_sent_at: new Date().toISOString() })
      .eq('id', lease.id)

    alerted++
  }

  return NextResponse.json({ ok: true, alerted })
}
