import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

export default async function ContractorWorkOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tickets } = await supabase
    .from('maintenance_tickets')
    .select('*, units(unit_number, buildings(name, address))')
    .eq('contractor_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Work Orders</h1>
        <p className="text-sm text-slate-500 mt-1">Jobs assigned to you from property managers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {!tickets || tickets.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <span className="text-4xl text-slate-300 mb-3 block">📭</span>
            <p className="text-sm font-medium text-slate-500">No work orders assigned yet.</p>
          </div>
        ) : (
          tickets.map(ticket => (
            <Link key={ticket.id} href={`/contractor/work-orders/${ticket.id}`}>
              <Card className="hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <Badge
                    label={ticket.status === 'in_progress' ? 'Active Job' : ticket.status}
                    variant={ticket.status === 'complete' ? 'green' : 'blue'}
                  />
                  {ticket.urgency === 'emergency' && <span className="text-lg" title="Emergency">🚨</span>}
                </div>
                <h3 className="font-semibold text-slate-900 line-clamp-2 min-h-[40px] mb-3">
                  {ticket.description}
                </h3>
                <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-sm text-slate-500">
                  <span className="mt-0.5">📍</span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-700">
                      {(ticket.units as any)?.buildings?.name}
                      {(ticket.units as any)?.unit_number ? ` (Unit ${(ticket.units as any).unit_number})` : ''}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{(ticket.units as any)?.buildings?.address}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
