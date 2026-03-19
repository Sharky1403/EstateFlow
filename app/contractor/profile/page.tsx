import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { InsuranceUpload } from './InsuranceUpload'
import { notFound } from 'next/navigation'

export default async function ContractorProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, email, phone, specialties')
    .eq('id', user.id)
    .single()

  const { data: insurance } = await supabase
    .from('contractor_insurance')
    .select('expiry_date, policy_document_url')
    .eq('contractor_id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your contractor details and insurance.</p>
      </div>

      <Card padding="lg" variant="elevated">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Account Details</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-28 shrink-0">Name</span>
            <span className="text-slate-800">{profile?.full_name ?? '—'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-28 shrink-0">Company</span>
            <span className="text-slate-800">{profile?.company_name ?? '—'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-28 shrink-0">Specialties</span>
            <span className="text-slate-800">{profile?.specialties?.join(', ') || 'General Contractor'}</span>
          </div>
        </div>
      </Card>

      <Card padding="lg" variant="elevated">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shrink-0">
            🛡️
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Insurance Certificate</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Keep your insurance up to date to remain assignable to work orders.
            </p>
          </div>
        </div>
        <InsuranceUpload
          contractorId={user.id}
          current={insurance ?? null}
        />
      </Card>
    </div>
  )
}
