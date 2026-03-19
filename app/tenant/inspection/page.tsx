import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'

const CONDITION_CONFIG: Record<string, { label: string; cls: string }> = {
  good: { label: 'Good', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  fair: { label: 'Fair', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  poor: { label: 'Poor', cls: 'bg-red-50 border-red-200 text-red-700' },
}

export default async function TenantInspectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get active lease
  const { data: lease } = await supabase
    .from('leases')
    .select('id')
    .eq('tenant_id', user!.id)
    .eq('status', 'active')
    .single()

  const { data: inspection } = lease
    ? await supabase
        .from('inspections')
        .select('*')
        .eq('lease_id', lease.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    : { data: null }

  if (!inspection) {
    return (
      <div className="space-y-4 page-enter">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Move-In Inspection</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your property condition report at move-in.</p>
        </div>
        <Card variant="flat">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">📋</span>
            <p className="text-sm font-medium text-slate-500">No inspection report yet</p>
            <p className="text-xs text-slate-400 mt-1">Your landlord will create one at move-in.</p>
          </div>
        </Card>
      </div>
    )
  }

  const rooms: any[] = inspection.rooms ?? []

  return (
    <div className="space-y-4 page-enter">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Move-In Inspection</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Report from {new Date(inspection.inspection_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {inspection.overall_notes && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm text-blue-800">
          <p className="font-semibold text-xs text-blue-600 uppercase tracking-wider mb-1">Overall Notes</p>
          <p>{inspection.overall_notes}</p>
        </div>
      )}

      <div className="space-y-3">
        {rooms.map((room: any, i: number) => {
          const condition = CONDITION_CONFIG[room.condition] ?? CONDITION_CONFIG.good
          return (
            <Card key={i} padding="md" variant="elevated">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-800">{room.name}</h3>
                <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 border ${condition.cls}`}>
                  {condition.label}
                </span>
              </div>
              {room.notes && (
                <p className="text-xs text-slate-500 mb-2">{room.notes}</p>
              )}
              {room.photo_url && (
                <img
                  src={room.photo_url}
                  alt={room.name}
                  className="w-full h-40 object-cover rounded-xl border border-slate-200"
                />
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
