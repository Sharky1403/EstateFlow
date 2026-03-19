import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { RenewLeaseButton } from './RenewLeaseButton'
import { TerminateLeaseButton } from './TerminateLeaseButton'
import { InviteButton } from './InviteButton'

const STATUS_VARIANT: Record<string, 'green' | 'yellow' | 'gray' | 'red'> = {
  active: 'green',
  draft: 'yellow',
  expired: 'gray',
  terminated: 'red',
}

export default async function LandlordLeasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: leases }, { data: vacantUnits }] = await Promise.all([
    supabase
      .from('leases')
      .select(`
        id, monthly_rent, start_date, end_date, status, signed_at, pdf_url, break_fee, break_fee_description,
        units(id, unit_number, buildings(id, name, landlord_id)),
        profiles!tenant_id(id, full_name)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('units')
      .select('id, unit_number, buildings(name, landlord_id)')
      .eq('occupied', false),
  ])

  const myLeases   = (leases ?? []).filter((l: any) => l.units?.buildings?.landlord_id === user?.id)
  const myVacant   = (vacantUnits ?? [])
    .filter((u: any) => u.buildings?.landlord_id === user?.id)
    .map((u: any) => ({ id: u.id, unit_number: u.unit_number, building_name: u.buildings?.name ?? '' }))

  const active      = myLeases.filter(l => l.status === 'active').length
  const expiring60  = myLeases.filter(l => {
    const days = Math.ceil((new Date(l.end_date).getTime() - Date.now()) / 86400000)
    return l.status === 'active' && days <= 60 && days > 0
  }).length
  const now = new Date()

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leases</h1>
          <p className="text-sm text-slate-500 mt-1">
            {myLeases.length} lease{myLeases.length !== 1 ? 's' : ''} across your portfolio
          </p>
        </div>
        {myVacant.length > 0 && <InviteButton units={myVacant} />}
      </div>

      {myLeases.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: myLeases.length, color: 'text-slate-800' },
            { label: 'Active', value: active, color: 'text-emerald-600' },
            { label: 'Expiring (60d)', value: expiring60, color: 'text-amber-600' },
            { label: 'Draft / Other', value: myLeases.length - active, color: 'text-slate-500' },
          ].map(m => (
            <Card key={m.label} variant="flat" padding="sm">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{m.label}</p>
              <p className={`text-2xl font-bold mt-1 ${m.color}`}>{m.value}</p>
            </Card>
          ))}
        </div>
      )}

      {myLeases.length === 0 ? (
        <Card variant="flat">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">📄</span>
            <p className="text-base font-semibold text-slate-600">No leases yet</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              Leases are created from individual unit pages when you assign a tenant.
            </p>
            <Link href="/landlord/properties" className="mt-6 text-sm text-primary-600 font-medium hover:underline">
              Go to Properties →
            </Link>
          </div>
        </Card>
      ) : (
        <Card variant="elevated" padding="lg">
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Tenant', 'Unit / Building', 'Monthly Rent', 'Start', 'End', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 px-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {myLeases.map((lease: any) => {
                  const daysLeft = Math.ceil((new Date(lease.end_date).getTime() - now.getTime()) / 86400000)
                  const expiringSoon = lease.status === 'active' && daysLeft <= 60 && daysLeft > 0

                  return (
                    <tr key={lease.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2">
                        <p className="font-medium text-slate-800">{lease.profiles?.full_name ?? '—'}</p>
                        {lease.signed_at && (
                          <p className="text-xs text-slate-400">
                            Signed {new Date(lease.signed_at).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <p className="text-slate-700 font-medium">{lease.units?.unit_number ?? '—'}</p>
                        <p className="text-xs text-slate-400">{lease.units?.buildings?.name ?? '—'}</p>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-700 tabular-nums">
                        ${Number(lease.monthly_rent).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-slate-500 whitespace-nowrap text-xs">
                        {new Date(lease.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <p className={`text-xs ${expiringSoon ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                          {new Date(lease.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {expiringSoon && (
                          <p className="text-xs text-amber-500">{daysLeft}d remaining</p>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          label={lease.status}
                          variant={STATUS_VARIANT[lease.status] ?? 'gray'}
                          dot
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          {lease.units?.buildings?.id && lease.units?.id && (
                            <Link
                              href={`/landlord/properties/${lease.units.buildings.id}/units/${lease.units.id}`}
                              className="text-xs text-primary-600 font-medium hover:underline whitespace-nowrap"
                            >
                              View Unit
                            </Link>
                          )}
                          {(lease.status === 'active' || lease.status === 'expired') && (
                            <RenewLeaseButton lease={lease} />
                          )}
                          {lease.status === 'active' && (
                            <TerminateLeaseButton lease={lease} />
                          )}
                          {lease.pdf_url && (
                            <a
                              href={lease.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
                            >
                              PDF
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
