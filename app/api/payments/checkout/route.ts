import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leaseId } = await req.json()

  const { data: lease } = await supabase
    .from('leases')
    .select('id, monthly_rent')
    .eq('id', leaseId)
    .eq('tenant_id', user.id)
    .eq('status', 'active')
    .single()

  if (!lease) return NextResponse.json({ error: 'Active lease not found' }, { status: 404 })

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email, stripe_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const { data: authData } = await admin.auth.admin.getUserById(user.id)
    const email = authData?.user?.email ?? profile?.email ?? ''

    const customer = await stripe.customers.create({
      email,
      name: profile?.full_name ?? '',
      metadata: { supabase_id: user.id },
    })
    customerId = customer.id

    await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Monthly Rent' },
        unit_amount: Math.round(Number(lease.monthly_rent) * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${appUrl}/tenant/rent?success=1`,
    cancel_url: `${appUrl}/tenant/rent`,
    payment_intent_data: {
      metadata: { lease_id: lease.id },
    },
  })

  return NextResponse.json({ url: session.url })
}
