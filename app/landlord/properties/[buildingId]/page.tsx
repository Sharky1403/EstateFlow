import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { NewUnitButton } from './NewUnitButton'
import { EditBuildingButton } from '../EditBuildingButton'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BuildingDetailPage({ params }: { params: Promise<{ buildingId: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  // Separate queries to avoid RLS cross-reference recursion between units and leases
  const [{ data: building }, { data: units }, { data: leases }] = await Promise.all([
    supabase.from('buildings').select('*').eq('id', resolvedParams.buildingId).single(),
    supabase.from('units').select('id, unit_number, floor_number, market_rent, actual_rent, occupied')
      .eq('building_id', resolvedParams.buildingId)
      .order('floor_number')
      .order('unit_number'),
    supabase.from('leases').select('unit_id, status, tenant_id, profiles(full_name)')
      .eq('status', 'active'),
  ])

  // Map active leases by unit_id for quick lookup
  const leaseByUnit: Record<string, { profiles: { full_name: string } | null }> = {}
  for (const l of leases ?? []) {
    leaseByUnit[l.unit_id] = { profiles: (l.profiles as any) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{building?.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{building?.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <EditBuildingButton building={{ id: resolvedParams.buildingId, name: building?.name ?? '', address: building?.address ?? '' }} />
          <NewUnitButton buildingId={resolvedParams.buildingId} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {units?.map(unit => {
          const activeLease = leaseByUnit[unit.id]
          return (
            <Link key={unit.id} href={`/landlord/properties/${resolvedParams.buildingId}/units/${unit.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-lg">Unit {unit.unit_number}</p>
                    <p className="text-sm text-gray-500">Floor {unit.floor_number}</p>
                  </div>
                  <Badge label={unit.occupied ? 'Occupied' : 'Vacant'} variant={unit.occupied ? 'green' : 'gray'} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">Market Rent</p>
                    <p className="font-medium">${unit.market_rent}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Actual Rent</p>
                    <p className={`font-medium ${unit.actual_rent < unit.market_rent ? 'text-warning' : 'text-success'}`}>
                      ${unit.actual_rent}
                    </p>
                  </div>
                </div>
                {activeLease?.profiles?.full_name && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">Tenant</p>
                    <p className="text-sm font-medium">{activeLease.profiles.full_name}</p>
                  </div>
                )}
              </Card>
            </Link>
          )
        })}

        {units?.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">No units yet. Click "Add Unit" to get started.</div>
        )}
      </div>
    </div>
  )
}
