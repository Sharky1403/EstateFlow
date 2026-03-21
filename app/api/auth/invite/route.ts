import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'
import { sendSMS } from '@/lib/twilio'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email, full_name, unit_id, phone } = await req.json()
  const supabase = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Try standard invite first
  const { data: inviteData, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role: 'tenant', full_name, unit_id },
    redirectTo: `${appUrl}/accept-invite`,
  })

  if (error) {
    // User already exists — send them a magic link email via Supabase
    if (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('registered')) {
      // Get the existing user to update their profile
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${appUrl}/accept-invite` },
      })

      if (!linkData?.user) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Update existing user's metadata and profile for the new unit
      await supabase.auth.admin.updateUserById(linkData.user.id, {
        user_metadata: { role: 'tenant', full_name, unit_id },
      })
      await supabase.from('profiles').upsert({
        id: linkData.user.id,
        role: 'tenant',
        full_name,
        invited_unit_id: unit_id,
      }, { onConflict: 'id' })

      // Send magic link email using the public client (triggers Supabase email)
      const supabasePublic = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabasePublic.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: `${appUrl}/accept-invite` },
      })

      if (phone && linkData.properties?.action_link) {
        await sendSMS(phone, `You've been added as a tenant on EstateFlow. Sign in here: ${linkData.properties.action_link}`)
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // New user — optionally send SMS with invite link
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
