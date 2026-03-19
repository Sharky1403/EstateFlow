import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { NewBuildingButton } from './newbuildingbutton'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch buildings and unit counts in separate queries to avoid RLS recursion
  const [{ data: buildings }, { data: unitCounts }] = await Promise.all([
    supabase
      .from('buildings')
      .select('id, name, address, created_at')
      .eq('landlord_id', user!.id),
    supabase
      .from('units')
      .select('building_id')
  ])

  // Build a count map: building_id -> count
  const countMap: Record<string, number> = {}
  for (const u of unitCounts ?? []) {
    countMap[u.building_id] = (countMap[u.building_id] ?? 0) + 1
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-sm text-slate-500 mt-1">
            {buildings?.length ?? 0} building{(buildings?.length ?? 0) !== 1 ? 's' : ''} in your portfolio
          </p>
        </div>
        <NewBuildingButton />
      </div>

      {buildings && buildings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {buildings.map((building) => {
            const unitCount = countMap[building.id] ?? 0
            return (
              <Link key={building.id} href={`/landlord/properties/${building.id}`}>
                <Card className="cursor-pointer group hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm">
                      {building.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm group-hover:text-primary-600 transition-colors truncate">
                        {building.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{building.address}</p>
                    </div>
                  </div>

                  <div className="my-4 h-px bg-slate-100" />

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span>🏠</span>
                      <span>{unitCount} unit{unitCount !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="flex items-center gap-1 text-primary-600 font-medium group-hover:gap-2 transition-all">
                      View details <span>→</span>
                    </span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card variant="flat">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">🏗️</span>
            <p className="text-base font-semibold text-slate-600">No buildings yet</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              Add your first building to start managing properties, units, and leases.
            </p>
            <div className="mt-6">
              <NewBuildingButton />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
