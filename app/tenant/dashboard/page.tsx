import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { daysUntilLeaseExpiry } from '@/lib/utils/date'
import Link from 'next/link'

export default async function TenantDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Welcome back 👋</h1>
      {lease ? (
        <Card>
          <p className="text-sm text-gray-500">Your Unit</p>
          <p className="text-lg font-semibold">
            {(lease.units as any)?.buildings?.name} — Unit {(lease.units as any)?.unit_number}
          </p>
          <p className="text-sm text-gray-400">{(lease.units as any)?.buildings?.address}</p>
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-xs text-gray-500">Monthly Rent</p>
              <p className="font-bold text-primary">${lease.monthly_rent}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Lease Expires</p>
              <p className={`font-bold ${daysLeft && daysLeft < 60 ? 'text-warning' : 'text-gray-700'}`}>
                {daysLeft} days
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-gray-500">No active lease found.</p>
        </Card>
      )}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent Tickets</h2>
          <Link href="/tenant/maintenance" className="text-sm text-primary">
            View all
          </Link>
        </div>
        {tickets?.length === 0 && <p className="text-sm text-gray-400">No open tickets.</p>}
        {tickets?.map(t => (
          <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
            <p className="text-sm truncate flex-1">{t.description.slice(0, 50)}...</p>
            <Badge label={t.status} variant={t.status === 'complete' ? 'green' : 'yellow'} />
          </div>
        ))}
      </Card>
    </div>
  )
}

