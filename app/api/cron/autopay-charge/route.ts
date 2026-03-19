import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { sendSMS } from '@/lib/twilio'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const cronSecret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Find tenants with autopay enabled + saved payment method + active lease
  const { data: tenants, error } = await admin
    .from('profiles')
    .select('id, full_name, phone, stripe_customer_id, stripe_payment_method_id')
    .eq('autopay_enabled', true)
    .not('stripe_payment_method_id', 'is', null)
    .not('stripe_customer_id', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let charged = 0

  for (const tenant of tenants ?? []) {
    // Get active lease
    const { data: lease } = await admin
      .from('leases')
      .select('id, monthly_rent')
      .eq('tenant_id', tenant.id)
      .eq('status', 'active')
      .single()

    if (!lease) continue

    // Check if rent already paid this month
    const today = new Date()
    const monthStart = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-01`

    const { data: alreadyPaid } = await admin
      .from('ledger_entries')
      .select('id')
      .eq('lease_id', lease.id)
      .eq('type', 'rent')
      .gte('paid_at', monthStart)
      .limit(1)

    if (alreadyPaid && alreadyPaid.length > 0) continue

    // Charge via Stripe off-session
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(lease.monthly_rent) * 100),
        currency: 'usd',
        customer: tenant.stripe_customer_id!,
        payment_method: tenant.stripe_payment_method_id!,
        confirm: true,
        off_session: true,
        metadata: { lease_id: lease.id },
        description: `Auto-pay: Monthly Rent — ${today.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
      })

      if (paymentIntent.status === 'succeeded') {
        // Log ledger entry immediately (webhook may also handle this — add idempotency check in webhook)
        await admin.from('ledger_entries').insert({
          lease_id: lease.id,
          type: 'rent',
          amount: Number(lease.monthly_rent),
          bucket: 'revenue',
          paid_at: new Date().toISOString(),
          description: `Auto-pay: ${today.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
        })
        charged++
      }
    } catch (stripeErr: any) {
      console.error(`Auto-pay failed for tenant ${tenant.id}:`, stripeErr.message)
      // Notify tenant of failed payment via SMS
      if (tenant.phone) {
        try {
          await sendSMS(
            tenant.phone,
            `Hi ${tenant.full_name ?? 'Tenant'}, your auto-pay rent charge failed this month. Please log in to EstateFlow to pay manually or update your payment method.`
          )
        } catch {}
      }
    }
  }

  return NextResponse.json({ ok: true, charged })
}
