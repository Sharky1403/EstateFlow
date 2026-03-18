import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { calculateNOI } from '@/lib/utils/finance'
import Link from 'next/link'

export default async function BuildingFinancePage({ params }: { params: Promise<{ buildingId: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: building } = await supabase.from('buildings').select('name').eq('id', resolvedParams.buildingId).single()

  const { data: entries } = await supabase
    .from('ledger_entries')
    .select('*, leases(unit_id, units(building_id))')
    .eq('leases.units.building_id', resolvedParams.buildingId)
    .order('created_at', { ascending: false })

  const revenue = entries?.filter(e => e.bucket === 'revenue').reduce((s, e) => s + e.amount, 0) ?? 0
  const expenses = entries?.filter(e => e.bucket === 'expense').reduce((s, e) => s + e.amount, 0) ?? 0
  const noi = calculateNOI(revenue, expenses)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/landlord/finance" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Finance
        </Link>
      </div>

      <h1 className="text-2xl font-bold">{building?.name} — Financials</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-success">${revenue.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-danger">${expenses.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Net Operating Income</p>
          <p className={`text-2xl font-bold ${noi >= 0 ? 'text-success' : 'text-danger'}`}>${noi.toLocaleString()}</p>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold mb-4">All Transactions</h2>
        {entries?.length === 0 && <p className="text-sm text-gray-400">No transactions yet.</p>}
        <div className="space-y-2">
          {entries?.map(e => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium capitalize">{e.type.replace('_', ' ')}</p>
                <p className="text-xs text-gray-400">{e.description}</p>
                <p className="text-xs text-gray-300">{e.paid_at ? new Date(e.paid_at).toLocaleDateString() : 'Pending'}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className={`font-semibold ${e.bucket === 'expense' ? 'text-danger' : 'text-success'}`}>
                  {e.bucket === 'expense' ? '-' : '+'}${e.amount}
                </p>
                <Badge
                  label={e.bucket.replace('_', ' ')}
                  variant={e.bucket === 'revenue' ? 'green' : e.bucket === 'expense' ? 'red' : 'yellow'}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

