import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TenantApplicationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, id_document_url, kyc_status, invited_unit_id')
    .eq('id', user!.id)
    .single()

  const { data: unit } = profile?.invited_unit_id
    ? await supabase.from('units').select('unit_number, buildings(name, address)').eq('id', profile.invited_unit_id).single()
    : { data: null }

  const steps = [
    { label: 'Invite accepted',     done: true },
    { label: 'Password set',        done: true },
    { label: 'ID document uploaded', done: !!profile?.id_document_url },
    { label: 'Landlord review',     done: profile?.kyc_status === 'approved' || profile?.kyc_status === 'rejected' },
    { label: 'Application decided', done: profile?.kyc_status === 'approved' || profile?.kyc_status === 'rejected' },
  ]

  const status = profile?.kyc_status ?? 'pending'

  return (
    <div className="space-y-6 page-enter max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Application</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track your rental application status.</p>
      </div>

      {/* Unit info */}
      {unit && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Applied Unit</p>
          <p className="font-semibold text-slate-900">Unit {(unit as any).unit_number} — {(unit as any).buildings?.name}</p>
          <p className="text-sm text-slate-400 mt-0.5">{(unit as any).buildings?.address}</p>
        </div>
      )}

      {/* Status banner */}
      <div className={`rounded-2xl p-5 border ${
        status === 'approved' ? 'bg-emerald-50 border-emerald-200' :
        status === 'rejected' ? 'bg-red-50 border-red-200' :
        'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳'}
          </span>
          <div>
            <p className={`font-bold text-sm ${
              status === 'approved' ? 'text-emerald-700' :
              status === 'rejected' ? 'text-red-600' :
              'text-amber-700'
            }`}>
              {status === 'approved' ? 'Application Approved!' :
               status === 'rejected' ? 'Application Rejected' :
               'Under Review'}
            </p>
            <p className={`text-xs mt-0.5 ${
              status === 'approved' ? 'text-emerald-600' :
              status === 'rejected' ? 'text-red-500' :
              'text-amber-600'
            }`}>
              {status === 'approved' ? 'Your landlord has approved your application. Check your lease tab.' :
               status === 'rejected' ? 'Your landlord has declined this application. Contact them for more info.' :
               !profile?.id_document_url ? 'Please upload your ID document to proceed.' :
               'Your landlord is reviewing your ID. This usually takes 1–2 business days.'}
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Application Progress</p>
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
              step.done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
            }`}>
              {step.done ? '✓' : i + 1}
            </div>
            <span className={`text-sm font-medium ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Upload ID CTA */}
      {!profile?.id_document_url && (
        <Link href="/verify"
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors">
          Upload ID Document →
        </Link>
      )}
    </div>
  )
}
