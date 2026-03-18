import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { RevenueChart } from './RevenueChart'

function StatCard({
  label, value, sub, gradient, icon, href,
}: {
  label: string
  value: string | number
  sub?: string
  gradient: string
  icon: React.ReactNode
  href?: string
}) {
  const content = (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 stat-ring group">
      {/* Subtle background tint on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ background: 'radial-gradient(circle at 85% 15%, rgba(37,99,235,0.04), transparent 60%)' }}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1.5 tabular-lining">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1 truncate">{sub}</p>}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: gradient }}
        >
          {icon}
        </div>
      </div>
    </div>
  )

  return href ? (
    <Link href={href} className="block">{content}</Link>
  ) : content
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: buildings } = await supabase.from('buildings').select('id, name, address')
  const { data: units }     = await supabase.from('units').select('id, occupied, market_rent, actual_rent, building_id')
  const { data: tickets }   = await supabase.from('maintenance_tickets').select('id, status')

  // Revenue trend — last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  const { data: ledger } = await supabase
    .from('ledger_entries')
    .select('amount, bucket, paid_at, created_at')
    .gte('created_at', sixMonthsAgo.toISOString())

  // Build monthly buckets
  const monthMap: Record<string, { revenue: number; expenses: number }> = {}
  for (let i = 0; i < 6; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    monthMap[key] = { revenue: 0, expenses: 0 }
  }
  for (const entry of ledger ?? []) {
    const d   = new Date(entry.created_at)
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (!monthMap[key]) continue
    if (entry.bucket === 'revenue') monthMap[key].revenue  += Number(entry.amount)
    if (entry.bucket === 'expense') monthMap[key].expenses += Number(entry.amount)
  }
  const chartData = Object.entries(monthMap).map(([month, v]) => ({ month, ...v }))

  const totalUnits    = units?.length ?? 0
  const occupiedUnits = units?.filter(u => u.occupied).length ?? 0
  const vacantUnits   = totalUnits - occupiedUnits
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
  const totalActual   = units?.reduce((s, u) => s + (u.actual_rent ?? 0), 0) ?? 0
  const totalMarket   = units?.reduce((s, u) => s + (u.market_rent ?? 0), 0) ?? 0
  const revenueGap    = totalMarket - totalActual
  const openTickets   = tickets?.filter(t => t.status === 'open').length ?? 0

  return (
    <div className="space-y-8 page-enter">

      {/* ── Page header ─────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Your portfolio at a glance.</p>
      </div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard
          label="Total Units"
          value={totalUnits}
          sub={`${buildings?.length ?? 0} building${(buildings?.length ?? 0) !== 1 ? 's' : ''}`}
          gradient="linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          }
        />
        <StatCard
          label="Occupancy Rate"
          value={`${occupancyRate}%`}
          sub={`${occupiedUnits} occupied · ${vacantUnits} vacant`}
          gradient="linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          }
        />
        <StatCard
          label="Monthly Rent"
          value={`$${totalActual.toLocaleString()}`}
          sub={revenueGap > 0 ? `-$${revenueGap.toLocaleString()} vs market` : 'At market rate'}
          gradient="linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          }
          href="/landlord/finance"
        />
        <StatCard
          label="Open Tickets"
          value={openTickets}
          sub="maintenance requests"
          gradient="linear-gradient(135deg, #ffedd5 0%, #fdba74 100%)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
            </svg>
          }
          href="/landlord/maintenance"
        />
      </div>

      {/* ── Occupancy progress ──────────────────────────── */}
      {totalUnits > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Portfolio Occupancy</p>
              <p className="text-xs text-slate-400 mt-0.5">{occupiedUnits} of {totalUnits} units occupied</p>
            </div>
            <span className={`text-lg font-bold tabular-lining ${occupancyRate >= 80 ? 'text-emerald-600' : 'text-orange-500'}`}>
              {occupancyRate}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${occupancyRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>{occupiedUnits} occupied</span>
            <span>{vacantUnits} vacant</span>
          </div>
        </div>
      )}

      {/* ── Revenue trend ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Revenue Trend</p>
            <p className="text-xs text-slate-400 mt-0.5">Last 6 months — revenue vs expenses</p>
          </div>
          <Link href="/landlord/finance" className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            View Finance →
          </Link>
        </div>
        <RevenueChart data={chartData} />
      </div>

      {/* ── Properties list ─────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">Your Properties</h2>
          <Link href="/landlord/properties" className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1">
            View all
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        </div>

        {buildings && buildings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {buildings.map(building => {
              const bUnits    = units?.filter(u => u.building_id === building.id) ?? []
              const bOccupied = bUnits.filter(u => u.occupied).length
              const bRate     = bUnits.length > 0 ? Math.round((bOccupied / bUnits.length) * 100) : 0

              return (
                <Link key={building.id} href={`/landlord/properties/${building.id}`}>
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 card-hover group cursor-pointer">
                    {/* Top colored stripe */}
                    <div className={`h-1 -mx-5 -mt-5 mb-4 rounded-t-2xl ${bRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`} />

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{building.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{building.address}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-medium">{bUnits.length} units</span>
                        <span className={`font-bold ${bRate >= 80 ? 'text-emerald-600' : 'text-orange-500'}`}>
                          {bRate}% occupied
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${bRate >= 80 ? 'bg-emerald-400' : 'bg-orange-400'}`}
                          style={{ width: `${bRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl mx-auto mb-4">🏗️</div>
            <p className="text-sm font-semibold text-slate-600">No properties yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Add your first building to get started.</p>
            <Link
              href="/landlord/properties"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Go to Properties →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
