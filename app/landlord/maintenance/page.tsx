import { createClient } from '@/lib/supabase/server'
import { FilterTabs } from './FilterTabs'
import type { MaintenanceTicket } from '@/types/database'

export default async function MaintenancePage() {
  const supabase = await createClient()
  const { data: tickets } = await supabase
    .from('maintenance_tickets')
    .select('*, units(unit_number, buildings(name))')
    .order('created_at', { ascending: false }) as { data: (MaintenanceTicket & { units: any })[] | null }

  const openCount = tickets?.filter(t => t.status === 'open').length ?? 0

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-sm text-slate-500 mt-1">
            {tickets?.length ?? 0} total tickets · {openCount} open
          </p>
        </div>
        {openCount > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
            <span className="text-orange-500 text-sm">⚠️</span>
            <span className="text-xs font-semibold text-orange-700">{openCount} require attention</span>
          </div>
        )}
      </div>

      <FilterTabs tickets={tickets ?? []} />
    </div>
  )
}
