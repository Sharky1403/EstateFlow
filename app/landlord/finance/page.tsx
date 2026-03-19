import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { calculateNOI } from '@/lib/utils/finance'
import { AddExpenseModal } from './AddExpenseModal'
import { RentComparisonChart } from './RentComparisonChart'

function MetricCard({ label, value, sub, gradient, icon }: {
  label: string
  value: string
  sub?: string
  gradient: string
  icon: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 stat-ring group">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ background: 'radial-gradient(circle at 85% 15%, rgba(37,99,235,0.04), transparent 60%)' }}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1.5 tabular-lining">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
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
}

export default async function FinancePage() {
  const supabase = await createClient()

  const [
    { data: entries },
    { data: buildings },
    { data: units },
  ] = await Promise.all([
    supabase.from('ledger_entries').select('*, leases(units(buildings(landlord_id)))'),
    supabase.from('buildings').select('id, name'),
    supabase.from('units').select('id, unit_number, market_rent, actual_rent, building_id, buildings(name)'),
  ])

  const revenue  = entries?.filter(e => e.bucket === 'revenue').reduce((s, e) => s + e.amount, 0) ?? 0
  const expenses = entries?.filter(e => e.bucket === 'expense').reduce((s, e) => s + e.amount, 0) ?? 0
  const noi      = calculateNOI(revenue, expenses)
  const margin   = revenue > 0 ? Math.round((noi / revenue) * 100) : 0

  const totalMarket = units?.reduce((s, u) => s + (u.market_rent ?? 0), 0) ?? 0
  const totalActual = units?.reduce((s, u) => s + (u.actual_rent ?? 0), 0) ?? 0
  const rentGap     = totalMarket - totalActual
  const rentGapPct  = totalMarket > 0 ? Math.round((rentGap / totalMarket) * 100) : 0

  const rentChartData = (units ?? [])
    .filter(u => (u.market_rent ?? 0) > 0 || (u.actual_rent ?? 0) > 0)
    .map(u => ({
      label: `${(u.buildings as any)?.name ?? ''} · ${u.unit_number}`,
      market: u.market_rent ?? 0,
      actual: u.actual_rent ?? 0,
    }))

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Overview</h1>
          <p className="text-sm text-slate-500 mt-1">All-time revenue, expenses, and net operating income.</p>
        </div>
        <div className="flex items-center gap-2">
          <AddExpenseModal buildings={buildings ?? []} />
          <Link
            href="/landlord/finance/tax-report"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 border border-primary-200 bg-primary-50 px-4 py-2 rounded-xl hover:bg-primary-100 transition-colors"
          >
            Tax Report
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
        <MetricCard
          label="Total Revenue"
          value={`$${revenue.toLocaleString()}`}
          sub="All rent & other income"
          gradient="linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          }
        />
        <MetricCard
          label="Total Expenses"
          value={`$${expenses.toLocaleString()}`}
          sub="Maintenance, utilities & more"
          gradient="linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
              <polyline points="17 18 23 18 23 12"/>
            </svg>
          }
        />
        <MetricCard
          label="Net Operating Income"
          value={`$${noi.toLocaleString()}`}
          sub={`${margin}% profit margin`}
          gradient={noi >= 0
            ? 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)'
            : 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)'}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={noi >= 0 ? '#2563eb' : '#dc2626'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          }
        />
      </div>

      {/* Profit margin bar */}
      {revenue > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Profit Margin</p>
              <p className="text-xs text-slate-400 mt-0.5">Net income ÷ total revenue</p>
            </div>
            <span className={`text-lg font-bold tabular-lining ${margin >= 40 ? 'text-emerald-600' : margin >= 20 ? 'text-amber-500' : 'text-red-500'}`}>
              {margin}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${margin >= 40 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : margin >= 20 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
              style={{ width: `${Math.max(0, Math.min(100, margin))}%` }}
            />
          </div>
        </div>
      )}

      {/* Market vs Actual Rent */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Market Rent vs Actual Rent</p>
            <p className="text-xs text-slate-400 mt-0.5">Per-unit comparison of potential vs collected rent</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <p className="text-slate-400 font-medium">Market Total</p>
              <p className="text-base font-bold text-slate-800 tabular-lining">${totalMarket.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 font-medium">Actual Total</p>
              <p className="text-base font-bold text-emerald-600 tabular-lining">${totalActual.toLocaleString()}</p>
            </div>
            {rentGap > 0 && (
              <div className="text-center">
                <p className="text-slate-400 font-medium">Gap</p>
                <p className="text-base font-bold text-orange-500 tabular-lining">−${rentGap.toLocaleString()} <span className="text-xs font-semibold">({rentGapPct}%)</span></p>
              </div>
            )}
          </div>
        </div>
        {rentGap > 0 && (
          <div className="mb-5">
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                style={{ width: `${100 - rentGapPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px] text-slate-400">
              <span className="text-emerald-600 font-medium">${totalActual.toLocaleString()} collected</span>
              <span className="text-orange-500 font-medium">${rentGap.toLocaleString()} unrealized</span>
            </div>
          </div>
        )}
        <RentComparisonChart data={rentChartData} />
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Recent Transactions</h2>
          <p className="text-xs text-slate-400 mt-0.5">Last 20 ledger entries</p>
        </div>

        {!entries || entries.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl mb-4">📭</div>
            <p className="text-sm font-semibold text-slate-500">No transactions yet</p>
            <p className="text-xs text-slate-400 mt-1">Records will appear as rent is collected.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Type', 'Amount', 'Description', 'Date'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-3 px-6 first:pl-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.slice(0, 20).map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 capitalize text-slate-600 text-xs font-medium">
                      {e.type?.replace(/_/g, ' ')}
                    </td>
                    <td className={`py-3.5 px-6 font-bold tabular-nums ${e.bucket === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {e.bucket === 'expense' ? '−' : '+'}${Number(e.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 max-w-xs truncate">{e.description ?? '—'}</td>
                    <td className="py-3.5 px-6 text-slate-400 whitespace-nowrap text-xs">
                      {e.paid_at ? new Date(e.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
