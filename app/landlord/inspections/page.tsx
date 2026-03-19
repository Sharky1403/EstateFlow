import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const CONDITION_BADGE: Record<string, string> = {
  good: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  fair: 'bg-amber-50 text-amber-700 border border-amber-200',
  poor: 'bg-red-50 text-red-700 border border-red-200',
}

export default async function InspectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: inspections } = await supabase
    .from('inspections')
    .select('*, leases(units(unit_number, buildings(name, landlord_id)), profiles!tenant_id(full_name))')
    .eq('created_by', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Move-In Inspections</h1>
          <p className="text-sm text-slate-500 mt-1">
            {inspections?.length ?? 0} inspection report{inspections?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/landlord/inspections/new">
          <Button variant="primary">New Inspection</Button>
        </Link>
      </div>

      {!inspections || inspections.length === 0 ? (
        <Card variant="flat">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">📋</span>
            <p className="text-base font-semibold text-slate-600">No inspections yet</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              Create a move-in inspection report to document property condition at lease start.
            </p>
            <Link href="/landlord/inspections/new" className="mt-6 text-sm text-primary-600 font-medium hover:underline">
              Create first inspection →
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {inspections.map((insp: any) => {
            const rooms: any[] = insp.rooms ?? []
            const poorRooms = rooms.filter(r => r.condition === 'poor').length
            const building = insp.leases?.units?.buildings?.name
            const unit = insp.leases?.units?.unit_number
            const tenant = insp.leases?.profiles?.full_name

            return (
              <Card key={insp.id} padding="md" variant="elevated" className="hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
                    📋
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{tenant ?? '—'}</p>
                    <p className="text-xs text-slate-400">{building}{unit ? ` — Unit ${unit}` : ''}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Inspected: {new Date(insp.inspection_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {rooms.slice(0, 4).map((r, i) => (
                    <span key={i} className={`text-xs rounded-full px-2 py-0.5 font-medium ${CONDITION_BADGE[r.condition] ?? CONDITION_BADGE.good}`}>
                      {r.name}
                    </span>
                  ))}
                  {rooms.length > 4 && (
                    <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-slate-100 text-slate-500">
                      +{rooms.length - 4} more
                    </span>
                  )}
                </div>
                {poorRooms > 0 && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    ⚠️ {poorRooms} room{poorRooms !== 1 ? 's' : ''} in poor condition
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
