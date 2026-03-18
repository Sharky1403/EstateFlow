import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { TaxReportDownload } from './TaxReportDownload'

export default async function TaxReportPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))
  const prevYear = year - 1
  const nextYear = year + 1
  const currentYear = new Date().getFullYear()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: entries } = await supabase
    .from('ledger_entries')
    .select('*, leases(units(buildings(landlord_id, name)))')
    .gte('paid_at', `${year}-01-01`)
    .lte('paid_at', `${year}-12-31`)

  const myEntries = (entries ?? []).filter(
    (e: any) => e.leases?.units?.buildings?.landlord_id === user?.id
  )

  const income   = myEntries.filter(e => e.bucket === 'revenue').reduce((s, e) => s + Number(e.amount), 0)
  const expenses = myEntries.filter(e => e.bucket === 'expense').reduce((s, e) => s + Number(e.amount), 0)
  const noi      = income - expenses

  const byBuilding: Record<string, { name: string; income: number; expenses: number }> = {}
  for (const e of myEntries) {
    const name = (e as any).leases?.units?.buildings?.name ?? 'Unknown'
    if (!byBuilding[name]) byBuilding[name] = { name, income: 0, expenses: 0 }
    if (e.bucket === 'revenue') byBuilding[name].income  += Number(e.amount)
    if (e.bucket === 'expense') byBuilding[name].expenses += Number(e.amount)
  }

  const buildings = Object.values(byBuilding)

  const byType: Record<string, number> = {}
  for (const e of myEntries) {
    if (!byType[e.type]) byType[e.type] = 0
    byType[e.type] += Number(e.amount)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/landlord/finance" className="text-xs text-slate-400 hover:text-slate-600">
            ← Back to Finance
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Tax Report — {year}</h1>
          <p className="text-sm text-slate-500">Annual summary of income and deductible expenses.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/landlord/finance/tax-report?year=${prevYear}`}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            ← {prevYear}
          </Link>
          {year < currentYear && (
            <Link
              href={`/landlord/finance/tax-report?year=${nextYear}`}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              {nextYear} →
            </Link>
          )}
          <TaxReportDownload year={year} />
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Gross Income', value: income, color: 'text-emerald-600', icon: '📈' },
          { label: 'Total Expenses', value: expenses, color: 'text-red-500', icon: '📉' },
          { label: 'Net Operating Income', value: noi, color: noi >= 0 ? 'text-blue-600' : 'text-red-600', icon: '💹' },
        ].map(m => (
          <Card key={m.label} variant="elevated">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{m.label}</p>
                <p className={`text-3xl font-bold mt-1.5 ${m.color}`}>
                  {noi < 0 && m.label === 'Net Operating Income' ? '−' : ''}
                  ${Math.abs(m.value).toLocaleString()}
                </p>
              </div>
              <span className="text-xl">{m.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {myEntries.length === 0 ? (
        <Card variant="flat">
          <p className="text-center text-slate-400 text-sm py-12">No transactions recorded for {year}.</p>
        </Card>
      ) : (
        <>
          {/* By Building */}
          {buildings.length > 0 && (
            <Card variant="elevated" padding="lg">
              <h2 className="text-base font-semibold text-slate-800 mb-4">Breakdown by Property</h2>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Property', 'Gross Income', 'Expenses', 'NOI'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 px-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {buildings.map(b => (
                      <tr key={b.name} className="hover:bg-slate-50">
                        <td className="py-3 px-2 font-medium text-slate-700">{b.name}</td>
                        <td className="py-3 px-2 text-emerald-600 font-semibold tabular-nums">+${b.income.toLocaleString()}</td>
                        <td className="py-3 px-2 text-red-500 font-semibold tabular-nums">−${b.expenses.toLocaleString()}</td>
                        <td className={`py-3 px-2 font-bold tabular-nums ${(b.income - b.expenses) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          ${(b.income - b.expenses).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* By Type */}
          <Card variant="elevated" padding="lg">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Income & Expense Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(byType).map(([type, amount]) => {
                const entry = myEntries.find(e => e.type === type)
                const isExpense = entry?.bucket === 'expense'
                return (
                  <div key={type} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-xs text-slate-400 capitalize">{type.replace(/_/g, ' ')}</p>
                    <p className={`text-lg font-bold mt-0.5 ${isExpense ? 'text-red-500' : 'text-emerald-600'}`}>
                      ${amount.toLocaleString()}
                    </p>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Full Ledger */}
          <Card variant="elevated" padding="lg">
            <h2 className="text-base font-semibold text-slate-800 mb-4">All Transactions ({year})</h2>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Date', 'Type', 'Property', 'Description', 'Amount'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 px-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {myEntries.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-2 text-slate-400 text-xs whitespace-nowrap">
                        {e.paid_at ? new Date(e.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="py-2.5 px-2 capitalize text-slate-600 text-xs font-medium">
                        {e.type?.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-2 text-slate-500 text-xs">
                        {e.leases?.units?.buildings?.name ?? '—'}
                      </td>
                      <td className="py-2.5 px-2 text-slate-400 text-xs max-w-xs truncate">
                        {e.description ?? '—'}
                      </td>
                      <td className={`py-2.5 px-2 font-semibold tabular-nums text-xs ${e.bucket === 'expense' ? 'text-red-500' : 'text-emerald-600'}`}>
                        {e.bucket === 'expense' ? '−' : '+'}${Number(e.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
