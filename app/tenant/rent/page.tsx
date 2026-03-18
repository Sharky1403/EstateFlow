import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
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
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Rent & Payments</h1>

      {params.success === '1' && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium">
          Payment successful! Your ledger will update shortly.
        </div>
      )}

      <Card>
        {lease ? (
          <>
            <p className="text-sm text-gray-500">Monthly Rent</p>
            <p className="text-3xl font-bold text-primary">${Number(lease.monthly_rent).toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">
              Lease: {new Date(lease.start_date).toLocaleDateString()} – {new Date(lease.end_date).toLocaleDateString()}
            </p>
            <PayNowButton leaseId={lease.id} amount={Number(lease.monthly_rent)} />
          </>
        ) : (
          <p className="text-sm text-gray-500">No active lease found.</p>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Payment History</h2>
        {!entries || entries.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No transactions yet.</p>
        ) : (
          entries.map(e => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium capitalize">{e.type.replace(/_/g, ' ')}</p>
                <p className="text-xs text-gray-400">
                  {e.paid_at ? new Date(e.paid_at).toLocaleDateString() : 'Pending'}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${e.bucket === 'expense' ? 'text-danger' : 'text-success'}`}>
                  ${Number(e.amount).toLocaleString()}
                </p>
                <Badge label={e.paid_at ? 'paid' : 'pending'} variant={e.paid_at ? 'green' : 'yellow'} />
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
