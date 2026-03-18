import { createAdminClient } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/twilio'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email, full_name, unit_id, phone } = await req.json()
  const supabase = createAdminClient()

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { data: { role: 'tenant', full_name, unit_id } },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (phone) {
    await sendSMS(phone, `You've been invited to EstateFlow. Complete your setup here: ${data.properties.action_link}`)
  }

  return NextResponse.json({ success: true })
}
