import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { PayNowButton } from './PayNowButton'

export default async function RentPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  const { data: lease } = await supabase
    .from('leases')
    .select('id, monthly_rent, start_date, end_date, status')
    .eq('tenant_id', user!.id)
    .eq('status', 'active')
    .single()

  const { data: entries } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('lease_id', lease?.id)
    .order('paid_at', { ascending: false })

  return (
    <div className="space-y-4 page-enter">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Rent & Payments</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your monthly payments.</p>
      </div>

      {/* Success banner */}
      {params.success === '1' && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 px-4 py-3.5 animate-scale-in">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-emerald-700">Payment successful! Your ledger will update shortly.</p>
        </div>
      )}

      {/* Rent payment card */}
      {lease ? (
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)' }}
        >
          <div aria-hidden className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div aria-hidden className="absolute top-6 right-12 w-16 h-16 rounded-full bg-white/5" />

          <div className="relative p-5">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Monthly Rent Due</p>
            <p className="text-white text-4xl font-bold tabular-lining">
              ${Number(lease.monthly_rent).toLocaleString()}
            </p>
            <p className="text-blue-200/70 text-xs mt-2">
              Lease: {new Date(lease.start_date).toLocaleDateString()} – {new Date(lease.end_date).toLocaleDateString()}
            </p>
            <div className="mt-4">
              <PayNowButton leaseId={lease.id} amount={Number(lease.monthly_rent)} />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-3">💳</div>
          <p className="text-slate-600 font-semibold text-sm">No active lease found</p>
          <p className="text-slate-400 text-xs mt-1">Contact your landlord to get set up.</p>
        </div>
      )}

      {/* Payment history */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Payment History</h2>
            <p className="text-xs text-slate-400 mt-0.5">{entries?.length ?? 0} transactions</p>
          </div>
        </div>

        {!entries || entries.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl mx-auto mb-3">📭</div>
            <p className="text-slate-500 text-sm font-medium">No transactions yet</p>
            <p className="text-slate-400 text-xs mt-1">Your payment history will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map(e => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  e.bucket === 'expense' ? 'bg-red-50' : 'bg-emerald-50'
                }`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={e.bucket === 'expense' ? '#dc2626' : '#059669'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {e.bucket === 'expense'
                      ? <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>
                      : <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>
                    }
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-sm font-medium capitalize">{e.type?.replace(/_/g, ' ')}</p>
                  <p className="text-slate-400 text-xs">
                    {e.paid_at ? new Date(e.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm tabular-lining ${e.bucket === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {e.bucket === 'expense' ? '−' : '+'}${Number(e.amount).toLocaleString()}
                  </p>
                  <Badge label={e.paid_at ? 'paid' : 'pending'} variant={e.paid_at ? 'green' : 'yellow'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
