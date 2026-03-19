import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { SignaturePad } from './SignaturePad'

const STATUS_VARIANT: Record<string, 'green' | 'yellow' | 'gray' | 'red'> = {
  active:     'green',
  draft:      'yellow',
  expired:    'gray',
  terminated: 'red',
}

export default async function LeasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: leases } = await supabase
    .from('leases')
    .select('*, units(unit_number, buildings(name, address))')
    .eq('tenant_id', user!.id)
    .order('start_date', { ascending: false })

  if (!leases || leases.length === 0) {
    return (
      <div className="space-y-4 page-enter">
        <h1 className="text-xl font-bold text-slate-900">My Leases</h1>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl mx-auto mb-4">📄</div>
          <p className="text-slate-600 font-semibold text-sm">No lease found</p>
          <p className="text-slate-400 text-xs mt-1">Your landlord will assign you a lease.</p>
        </div>
      </div>
    )
  }

  const now = new Date()

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Leases</h1>
        <p className="text-sm text-slate-500 mt-0.5">{leases.length} lease{leases.length !== 1 ? 's' : ''} on file.</p>
      </div>

      {leases.map((lease: any) => {
        const end          = new Date(lease.end_date)
        const daysLeft     = Math.ceil((end.getTime() - now.getTime()) / 86400000)
        const expiringSoon = lease.status === 'active' && daysLeft > 0 && daysLeft <= 60
        const unit         = lease.units
        const building     = unit?.buildings

        return (
          <div key={lease.id} className="space-y-4">
            {/* Details card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
              <div
                className="h-1.5"
                style={{ background: lease.status === 'active' ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #94a3b8, #cbd5e1)' }}
              />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {building?.name ?? '—'} · Unit {unit?.unit_number ?? '—'}
                    </p>
                    {building?.address && (
                      <p className="text-xs text-slate-400 mt-0.5">{building.address}</p>
                    )}
                  </div>
                  <Badge label={lease.status} variant={STATUS_VARIANT[lease.status] ?? 'gray'} dot />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Start Date',   value: new Date(lease.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                    { label: 'End Date',     value: new Date(lease.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                    { label: 'Monthly Rent', value: `$${Number(lease.monthly_rent).toLocaleString()}` },
                    { label: 'Signed',       value: lease.signed_at ? new Date(lease.signed_at).toLocaleDateString() : 'Pending' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-slate-800 font-semibold text-sm">{value}</p>
                    </div>
                  ))}
                </div>

                {expiringSoon && (
                  <div className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200/80 rounded-xl p-3">
                    <span className="text-amber-500 text-base shrink-0">⚠️</span>
                    <div>
                      <p className="text-amber-800 text-xs font-semibold">Lease expiring in {daysLeft} days</p>
                      <p className="text-amber-600 text-xs mt-0.5">Contact your landlord to discuss renewal.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Clauses */}
            {lease.clauses?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
                <h2 className="text-sm font-bold text-slate-800 mb-4">Lease Clauses</h2>
                <div className="space-y-3">
                  {lease.clauses.map((c: { title: string; body: string }, i: number) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1 rounded-full bg-gradient-to-b from-primary-400 to-primary-600 shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{c.title}</p>
                        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* E-signature — only for unsigned active leases */}
            {!lease.signed_at && lease.status === 'active' && (
              <SignaturePad leaseId={lease.id} />
            )}

            {/* PDF download — always shown when available */}
            {lease.pdf_url && (
              <a
                href={lease.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white border border-slate-200/80 shadow-card text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF — {lease.status === 'active' ? 'Current Lease' : `${new Date(lease.start_date).getFullYear()} Lease`}
              </a>
            )}

            {leases.indexOf(lease) < leases.length - 1 && (
              <hr className="border-slate-100" />
            )}
          </div>
        )
      })}
    </div>
  )
}
