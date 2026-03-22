import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { daysUntilLeaseExpiry } from '@/lib/utils/date'
import Link from 'next/link'

export default async function TenantDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, invited_unit_id')
    .eq('id', user!.id)
    .single()

  const { data: invitedUnit } = profile?.invited_unit_id
    ? await supabase.from('units').select('unit_number, buildings(name, address)').eq('id', profile.invited_unit_id).single()
    : { data: null }

  const { data: lease } = await supabase
    .from('leases')
    .select('*, units(unit_number, buildings(name, address))')
    .eq('tenant_id', user!.id)
    .eq('status', 'active')
    .single()

  const { data: tickets } = await supabase
    .from('maintenance_tickets')
    .select('*')
    .eq('tenant_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const daysLeft = lease ? daysUntilLeaseExpiry(lease.end_date) : null
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const leaseUrgent = daysLeft !== null && daysLeft < 60

  return (
    <div className="space-y-4 page-enter">

      {/* ── Welcome banner ──────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden p-5"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)' }}
      >
        {/* Decorative circles */}
        <div aria-hidden className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
        <div aria-hidden className="absolute top-4 right-8 w-12 h-12 rounded-full bg-white/5" />

        <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Welcome back</p>
        <h1 className="text-white text-xl font-bold">{firstName} 👋</h1>

        {lease && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
              <span className="text-blue-200 text-xs">Unit</span>
              <span className="text-white text-xs font-bold">{(lease.units as any)?.unit_number}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
              <span className="text-blue-200 text-xs font-medium truncate max-w-[120px]">{(lease.units as any)?.buildings?.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Lease info card ─────────────────────────────── */}
      {lease ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Lease</p>
                <p className="text-slate-800 font-semibold text-sm mt-0.5">
                  {(lease.units as any)?.buildings?.name}
                </p>
                <p className="text-slate-400 text-xs">{(lease.units as any)?.buildings?.address}</p>
              </div>
              <Badge label="Active" variant="green" dot />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Rent</p>
                <p className="text-slate-800 font-bold text-sm">${lease.monthly_rent?.toLocaleString()}</p>
                <p className="text-slate-400 text-[10px]">/ month</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${leaseUrgent ? 'bg-orange-50' : 'bg-slate-50'}`}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Expires</p>
                <p className={`font-bold text-sm ${leaseUrgent ? 'text-orange-600' : 'text-slate-800'}`}>
                  {daysLeft}d
                </p>
                <p className={`text-[10px] ${leaseUrgent ? 'text-orange-400' : 'text-slate-400'}`}>remaining</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Unit</p>
                <p className="text-blue-700 font-bold text-sm">{(lease.units as any)?.unit_number}</p>
                <p className="text-slate-400 text-[10px]">your home</p>
              </div>
            </div>

            {leaseUrgent && (
              <div className="mt-3 flex items-center gap-2 bg-orange-50 border border-orange-200/80 rounded-xl px-3 py-2">
                <span className="text-orange-500 text-sm">⚠️</span>
                <p className="text-orange-700 text-xs font-medium">Lease expires soon — contact your landlord.</p>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="border-t border-slate-100 grid grid-cols-2 divide-x divide-slate-100">
            <Link href="/tenant/rent" className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-primary-600 hover:bg-primary-50 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Pay Rent
            </Link>
            <Link href="/tenant/lease" className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              View Lease
            </Link>
          </div>
        </div>
      ) : invitedUnit ? (
        <Link href="/tenant/application" className="block bg-white rounded-2xl border border-blue-200 shadow-card p-5 hover:border-blue-400 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">🏠</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-0.5">Invited Unit</p>
              <p className="text-slate-800 font-semibold text-sm">Unit {(invitedUnit as any).unit_number} — {(invitedUnit as any).buildings?.name}</p>
              <p className="text-slate-400 text-xs truncate">{(invitedUnit as any).buildings?.address}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
          <div className="mt-3 bg-blue-50 rounded-xl px-3 py-2 text-xs text-blue-700 font-medium">
            Complete your application →
          </div>
        </Link>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-3">🏠</div>
          <p className="text-slate-700 font-semibold text-sm">No active lease</p>
          <p className="text-slate-400 text-xs mt-1">Your landlord will assign you a unit.</p>
        </div>
      )}

      {/* ── Maintenance tickets ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-sm font-bold text-slate-800">Recent Tickets</h2>
          <Link
            href="/tenant/maintenance"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
          >
            View all
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {(!tickets || tickets.length === 0) ? (
            <div className="px-5 py-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl mx-auto mb-2">✅</div>
              <p className="text-slate-500 text-sm font-medium">All clear!</p>
              <p className="text-slate-400 text-xs mt-0.5">No maintenance issues reported.</p>
            </div>
          ) : (
            tickets.map(t => (
              <Link key={t.id} href={`/tenant/maintenance/${t.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-xs font-medium truncate">{t.description?.slice(0, 55)}…</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <Badge
                  label={t.status}
                  variant={t.status === 'complete' ? 'green' : t.status === 'in_progress' ? 'blue' : 'yellow'}
                  dot
                />
              </Link>
            ))
          )}
        </div>

        {/* New ticket button */}
        <div className="px-5 py-4 border-t border-slate-100">
          <Link
            href="/tenant/maintenance/new"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-500 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-200 text-xs font-semibold"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Report an issue
          </Link>
        </div>
      </div>
    </div>
  )
}
