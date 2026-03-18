import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { calculateNOI } from '@/lib/utils/finance'

function MetricCard({ label, value, sub, color, icon, trend }: {
  label: string; value: string; sub?: string
  color: string; icon: string; trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card variant="elevated" className="stat-ring">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-1.5 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
    </Card>
  )
}

export default async function FinancePage() {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('ledger_entries')
    .select('*, leases(units(buildings(landlord_id)))')

  const revenue  = entries?.filter(e => e.bucket === 'revenue').reduce((s, e) => s + e.amount, 0) ?? 0
  const expenses = entries?.filter(e => e.bucket === 'expense').reduce((s, e) => s + e.amount, 0) ?? 0
  const noi      = calculateNOI(revenue, expenses)
  const margin   = revenue > 0 ? Math.round((noi / revenue) * 100) : 0

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
          <p className="text-sm text-slate-500 mt-1">All-time revenue, expenses, and net operating income.</p>
        </div>
        <Link
          href="/landlord/finance/tax-report"
          className="text-sm font-medium text-primary-600 border border-primary-200 bg-primary-50 px-4 py-2 rounded-xl hover:bg-primary-100 transition-colors"
        >
          Tax Report →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          label="Total Revenue"  value={`$${revenue.toLocaleString()}`}
          icon="📈" color="text-emerald-600"
          sub="All rent & other income"
        />
        <MetricCard
          label="Total Expenses" value={`$${expenses.toLocaleString()}`}
          icon="📉" color="text-red-600"
          sub="Maintenance, utilities & more"
        />
        <MetricCard
          label="Net Operating Income" value={`$${noi.toLocaleString()}`}
          icon="💹" color={noi >= 0 ? 'text-blue-600' : 'text-red-600'}
          sub={`${margin}% profit margin`}
        />
      </div>

      {revenue > 0 && (
        <Card variant="flat" padding="md">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Profit Margin</p>
            <span className={`text-sm font-bold ${margin >= 40 ? 'text-emerald-600' : margin >= 20 ? 'text-amber-500' : 'text-red-500'}`}>
              {margin}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${margin >= 40 ? 'bg-emerald-500' : margin >= 20 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${Math.max(0, Math.min(100, margin))}%` }}
            />
          </div>
        </Card>
      )}

      <Card variant="elevated" padding="lg">
        <h2 className="text-base font-semibold text-slate-800 mb-5">Recent Transactions</h2>
        {!entries || entries.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <span className="text-3xl mb-2">📭</span>
            <p className="text-sm text-slate-400">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Type', 'Amount', 'Description', 'Date'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 px-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.slice(0, 20).map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2 capitalize text-slate-600 text-xs font-medium">
                      {e.type?.replace(/_/g, ' ')}
                    </td>
                    <td className={`py-3 px-2 font-semibold tabular-nums ${e.bucket === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {e.bucket === 'expense' ? '−' : '+'}${Number(e.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-slate-500 max-w-xs truncate">{e.description ?? '—'}</td>
                    <td className="py-3 px-2 text-slate-400 whitespace-nowrap text-xs">
                      {e.paid_at ? new Date(e.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
