import { createClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio'
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

  if (sent_via.includes('sms')) {
    const { data: tenants } = await supabase
      .from('leases')
      .select('profiles(phone)')
      .eq('units.building_id', building_id)
      .eq('status', 'active')

    for (const t of tenants ?? []) {
      const phone = (t.profiles as any)?.phone
      if (phone) await sendSMS(phone, body)
    }
  }

  return NextResponse.json({ success: true })
}
