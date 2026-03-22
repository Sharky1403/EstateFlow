import { createAdminClient } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/twilio'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const emailHtml = (full_name: string, actionLink: string, isNew: boolean) => `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
    <h2 style="margin:0 0 8px">You've been invited to EstateFlow</h2>
    <p style="color:#555;margin:0 0 24px">
      Hi ${full_name}, your landlord has added you as a tenant.
      ${isNew
        ? 'Click the button below to create your password and access your account.'
        : 'Click the button below to sign in and view your unit.'}
    </p>
    <a href="${actionLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600">
      ${isNew ? 'Create My Account' : 'Sign In to My Account'}
    </a>
    <p style="color:#999;font-size:12px;margin-top:24px">
      ${isNew ? 'This link expires in 24 hours.' : 'Sign in with your existing EstateFlow credentials.'}
    </p>
  </div>
`

export async function POST(req: Request) {
  const { email, full_name, unit_id, phone } = await req.json()
  const supabase = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Generate an invite link — creates the user if new, errors if already confirmed
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      data: { role: 'tenant', full_name, unit_id },
      redirectTo: `${appUrl}/accept-invite`,
    },
  })

  if (!inviteError && inviteData?.user) {
    // ── New user ──────────────────────────────────────────────────────────
    const user = inviteData.user
    const actionLink = inviteData.properties?.action_link

    // Create their profile immediately so accept-invite can read it
    await supabase.from('profiles').upsert({
      id: user.id,
      role: 'tenant',
      full_name,
      invited_unit_id: unit_id,
    })

    if (actionLink) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'EstateFlow <onboarding@resend.dev>',
        to: email,
        subject: "You've been invited to EstateFlow",
        html: emailHtml(full_name, actionLink, true),
      })
      if (phone) {
        await sendSMS(phone, `You've been invited to EstateFlow. Create your account here: ${actionLink}`)
      }
    }

    return NextResponse.json({ success: true })
  }

  // ── Existing confirmed user ───────────────────────────────────────────
  if (
    inviteError &&
    (inviteError.message.toLowerCase().includes('already') ||
     inviteError.message.toLowerCase().includes('registered') ||
     inviteError.message.toLowerCase().includes('email') ||
     inviteError.message.toLowerCase().includes('exists'))
  ) {
    // Resolve user ID via magiclink generateLink (doesn't send email)
    const { data: mlData } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${appUrl}/login` },
    })

    if (!mlData?.user) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 })
    }

    // Update profile: set role to tenant and record invited unit
    await supabase.from('profiles')
      .update({ invited_unit_id: unit_id, role: 'tenant', full_name })
      .eq('id', mlData.user.id)

    // Send login link — goes through /api/auth/logout to clear any current session first
    const loginLink = `${appUrl}/api/auth/logout`
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'EstateFlow <onboarding@resend.dev>',
      to: email,
      subject: "You've been invited to EstateFlow",
      html: emailHtml(full_name, loginLink, false),
    })

    if (phone) {
      await sendSMS(phone, `You've been added as a tenant on EstateFlow. Sign in here: ${loginLink}`)
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: inviteError?.message ?? 'Unknown error' }, { status: 400 })
}
