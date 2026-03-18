import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { LogoutButton } from './LogoutButton'

export default async function TenantProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, id_document_url')
    .eq('id', user!.id)
    .single()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Profile</h1>

      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
            {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{profile?.full_name}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Phone</span>
            <span className="font-medium text-slate-700">{profile?.phone ?? '—'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">ID Verification</span>
            <span className={`font-medium ${profile?.id_document_url ? 'text-emerald-600' : 'text-amber-500'}`}>
              {profile?.id_document_url ? 'Submitted' : 'Pending'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Account</span>
            <span className="font-medium text-slate-700">Tenant</span>
          </div>
        </div>
      </Card>

      <Card>
        <LogoutButton />
      </Card>
    </div>
  )
}
