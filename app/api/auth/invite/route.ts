import { createAdminClient } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/twilio'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email, full_name, unit_id, phone } = await req.json()
  const supabase = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Try standard invite first (works for new users)
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role: 'tenant', full_name, unit_id },
    redirectTo: `${appUrl}/accept-invite`,
  })

  if (error) {
    // User already exists — update their profile and send a plain login link
    if (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('registered')) {
      // Use generateLink only to resolve the user ID; we won't send the magic link itself
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${appUrl}/login` },
      })

      if (!linkData?.user) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Always set role to tenant and record the invited unit
      await supabase.from('profiles')
        .update({ invited_unit_id: unit_id, role: 'tenant', full_name })
        .eq('id', linkData.user.id)

      // Link goes to /api/auth/logout which signs out any current session then redirects to /login
      const inviteLink = `${appUrl}/api/auth/logout`
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'EstateFlow <onboarding@resend.dev>',
        to: email,
        subject: "You've been invited to EstateFlow",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="margin:0 0 8px">You've been invited to EstateFlow</h2>
            <p style="color:#555;margin:0 0 24px">Hi ${full_name}, your landlord has added you as a tenant. Sign in to view your unit and complete your application.</p>
            <a href="${inviteLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600">
              Sign In to My Account
            </a>
            <p style="color:#999;font-size:12px;margin-top:24px">Sign in with your existing EstateFlow credentials.</p>
          </div>
        `,
      })

      if (phone) {
        await sendSMS(phone, `You've been added as a tenant on EstateFlow. Sign in here: ${inviteLink}`)
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // New user — Supabase sends the invite email automatically
  // Optionally also send SMS
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
