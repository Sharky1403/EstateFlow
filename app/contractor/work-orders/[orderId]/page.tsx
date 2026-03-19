import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TicketChat } from './TicketChat'

export default async function ContractorWorkOrderDetails({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from('maintenance_tickets')
    .select('*, units(unit_number, access_code, buildings(name, address)), profiles!tenant_id(full_name, phone)')
    .eq('id', resolvedParams.orderId)
    .single()

  if (!ticket) return notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/contractor/work-orders" className="hover:text-primary-600">Work Orders</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Job #{ticket.id.slice(0, 8)}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card padding="lg">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge label={ticket.status === 'in_progress' ? 'Active Job' : ticket.status} variant={ticket.status === 'complete' ? 'green' : 'blue'} />
              {ticket.urgency === 'emergency' && <Badge label="Emergency" variant="red" dot />}
            </div>

            <h1 className="text-xl font-bold text-slate-900 mb-2">{ticket.description}</h1>
            <p className="text-xs text-slate-400 mb-6">
              Assigned on {new Date(ticket.created_at).toLocaleDateString()}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><span className="text-base">📍</span> Location</p>
                <div className="mt-2 text-sm">
                  <p className="font-semibold text-slate-900">{(ticket.units as any)?.buildings?.name} (Unit {(ticket.units as any)?.unit_number})</p>
                  <p className="text-slate-500 mt-0.5">{(ticket.units as any)?.buildings?.address}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><span className="text-base">👤</span> Contact</p>
                <div className="mt-2 text-sm">
                  <p className="font-semibold text-slate-900">{(ticket.profiles as any)?.full_name ?? 'Tenant'}</p>
                  <p className="text-slate-500 mt-0.5">{(ticket.profiles as any)?.phone ?? 'No phone provided'}</p>
                </div>
              </div>
              {(ticket.units as any)?.access_code && (
                <div className="sm:col-span-2 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <span className="text-base">🔑</span> Access Code
                  </p>
                  <p className="font-mono font-bold text-amber-900 text-base tracking-widest">
                    {(ticket.units as any).access_code}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">Keep this confidential. Do not share with unauthorised persons.</p>
                </div>
              )}
            </div>
          </Card>

          <TicketChat ticketId={ticket.id} currentStatus={ticket.status} />
        </div>
      </div>
    </div>
  )
}
