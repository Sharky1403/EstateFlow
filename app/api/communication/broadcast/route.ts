import { createClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio'
import { sendPushNotification } from '@/lib/push'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { building_id, body, sent_via } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('announcements').insert({
    landlord_id: user!.id,
    building_id,
    body,
    sent_via,
  })

  // Fetch active tenants in this building
  const { data: tenants } = await supabase
    .from('leases')
    .select('tenant_id, profiles(phone)')
    .eq('status', 'active')
    .not('units', 'is', null)

  const tenantIds = tenants?.map(t => t.tenant_id).filter(Boolean) ?? []

  if (sent_via.includes('sms')) {
    for (const t of tenants ?? []) {
      const phone = (t.profiles as any)?.phone
      if (phone) await sendSMS(phone, body)
    }
  }

  if (sent_via.includes('push') && tenantIds.length > 0) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', tenantIds)

    await Promise.allSettled(
      (subs ?? []).map(sub =>
        sendPushNotification(sub, {
          title: 'Building Announcement',
          body,
          url: '/tenant/announcements',
        })
      )
    )
  }

  return NextResponse.json({ success: true })
}
