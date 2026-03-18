import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as any
    const supabase = createAdminClient()
    await supabase.from('ledger_entries').insert({
      lease_id: pi.metadata.lease_id,
      type: 'rent',
      amount: pi.amount / 100,
      bucket: 'revenue',
      paid_at: new Date().toISOString(),
      description: 'Rent payment via Stripe',
    })
  }

  return NextResponse.json({ received: true })
}
