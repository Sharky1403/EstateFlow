import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role === 'landlord') redirect('/landlord/dashboard')
  if (profile?.role === 'tenant') redirect('/tenant/dashboard')
  if (profile?.role === 'contractor') redirect('/contractor/work-orders')

  redirect('/login')
}
