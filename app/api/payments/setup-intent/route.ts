import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session',
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
  })

  return NextResponse.json({ clientSecret: setupIntent.client_secret })
}
