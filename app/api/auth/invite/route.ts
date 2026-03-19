import { createAdminClient } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/twilio'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email, full_name, unit_id, phone } = await req.json()
  const supabase = createAdminClient()

  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role: 'tenant', full_name, unit_id },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/accept-invite`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (phone) {
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { data: { role: 'tenant', full_name, unit_id } },
    })
    if (linkData?.properties?.action_link) {
      await sendSMS(phone, `You've been invited to EstateFlow. Complete your setup here: ${linkData.properties.action_link}`)
    }
  }

  return NextResponse.json({ success: true })
}
