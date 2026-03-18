import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile }   = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: feeConfig } = await supabase.from('late_fee_config').select('*').eq('landlord_id', user!.id).single()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and billing configuration.</p>
      </div>
      <SettingsForm profile={profile} feeConfig={feeConfig} />
    </div>
  )
}
