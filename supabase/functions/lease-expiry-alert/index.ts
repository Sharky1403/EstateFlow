import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const sixtyDaysFromNow = new Date()
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)

  const { data: leases } = await supabase
    .from('leases')
    .select('*, profiles(email, full_name)')
    .eq('status', 'active')
    .lte('end_date', sixtyDaysFromNow.toISOString())

  for (const lease of leases ?? []) {
    const tenantEmail = (lease.profiles as any)?.email
    if (!tenantEmail) continue
    await supabase.auth.admin.sendRawEmail({
      to: tenantEmail,
      subject: 'Your lease expires in 60 days — EstateFlow',
      html: `<p>Hi ${(lease.profiles as any)?.full_name},</p><p>Your lease expires on <strong>${lease.end_date}</strong>. Please contact your landlord to renew or plan your move.</p>`,
    } as any)
  }

  return new Response(JSON.stringify({ processed: leases?.length }), { headers: { 'Content-Type': 'application/json' } })
})
