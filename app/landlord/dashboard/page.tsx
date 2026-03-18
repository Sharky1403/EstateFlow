import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

function StatCard({
  label, value, sub, color, icon, href,
}: {
  label: string; value: string | number; sub?: string
  color: string; icon: string; href?: string
}) {
  const content = (
    <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-card hover:shadow-card-md transition-all duration-200 stat-ring bg-white`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-1.5 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${color.replace('text-','bg-').replace('-600','-100').replace('-500','-100').replace('-700','-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: buildings } = await supabase.from('buildings').select('id, name, address')
  const { data: units }     = await supabase.from('units').select('id, occupied, market_rent, actual_rent, building_id')
  const { data: tickets }   = await supabase.from('maintenance_tickets').select('id, status')

  const totalUnits    = units?.length ?? 0
  const occupiedUnits = units?.filter(u => u.occupied).length ?? 0
  const vacantUnits   = totalUnits - occupiedUnits
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
  const totalActual   = units?.reduce((s, u) => s + (u.actual_rent ?? 0), 0) ?? 0
  const totalMarket   = units?.reduce((s, u) => s + (u.market_rent ?? 0), 0) ?? 0
  const revenueGap    = totalMarket - totalActual
  const openTickets   = tickets?.filter(t => t.status === 'open').length ?? 0

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back — here's your portfolio at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Units"    value={totalUnits}    icon="🏠" color="text-slate-700"
          sub={`${buildings?.length ?? 0} building${(buildings?.length ?? 0) !== 1 ? 's' : ''}`} />
        <StatCard label="Occupancy Rate" value={`${occupancyRate}%`} icon="📊" color="text-emerald-600"
          sub={`${occupiedUnits} occupied · ${vacantUnits} vacant`} />
        <StatCard label="Monthly Rent"   value={`$${totalActual.toLocaleString()}`} icon="💰" color="text-blue-600"
          sub={revenueGap > 0 ? `-$${revenueGap.toLocaleString()} vs market` : 'At market rate'}
          href="/landlord/finance" />
        <StatCard label="Open Tickets"   value={openTickets}   icon="🔧" color="text-orange-500"
          sub="maintenance requests" href="/landlord/maintenance" />
      </div>

      {totalUnits > 0 && (
        <Card variant="flat" padding="md">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Portfolio Occupancy</p>
            <span className={`text-sm font-bold ${occupancyRate >= 80 ? 'text-emerald-600' : 'text-orange-500'}`}>
              {occupancyRate}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${occupancyRate >= 80 ? 'bg-emerald-500' : 'bg-orange-400'}`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>{occupiedUnits} occupied</span>
            <span>{vacantUnits} vacant</span>
          </div>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Your Properties</h2>
          <Link href="/landlord/properties" className="text-xs text-primary-600 hover:underline font-medium">
            View all →
          </Link>
        </div>

        {buildings && buildings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map(building => {
              const bUnits    = units?.filter(u => u.building_id === building.id) ?? []
              const bOccupied = bUnits.filter(u => u.occupied).length
              const bRate     = bUnits.length > 0 ? Math.round((bOccupied / bUnits.length) * 100) : 0

              return (
                <Link key={building.id} href={`/landlord/properties/${building.id}`}>
                  <Card className="hover:shadow-card-md transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shrink-0 group-hover:bg-blue-100 transition-colors">
                        🏢
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{building.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{building.address}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">{bUnits.length} units</span>
                        <span className={`font-semibold ${bRate >= 80 ? 'text-emerald-600' : 'text-orange-500'}`}>
                          {bRate}% occupied
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${bRate >= 80 ? 'bg-emerald-400' : 'bg-orange-400'}`}
                          style={{ width: `${bRate}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card variant="flat">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-3">🏗️</span>
              <p className="text-sm font-medium text-slate-500">No properties yet</p>
              <p className="text-xs text-slate-400 mt-1">Add your first building to get started.</p>
              <Link href="/landlord/properties" className="mt-4 text-xs text-primary-600 hover:underline font-medium">
                Go to Properties →
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
