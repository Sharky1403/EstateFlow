import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TicketChat } from '@/app/(tenant)/maintenance/[ticketId]/TicketChat'

export default async function TenantTicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from('maintenance_tickets')
    .select('*, units(unit_number, buildings(name, address)), contractor:profiles!contractor_id(company_name, phone)')
    .eq('id', resolvedParams.ticketId)
    .single()

  if (!ticket) return notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/tenant/maintenance" className="hover:text-primary-600">Maintenance</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Ticket #{ticket.id.slice(0, 8)}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card padding="lg">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge label={ticket.status === 'in_progress' ? 'In Progress' : ticket.status} variant={ticket.status === 'complete' ? 'green' : 'blue'} />
              {ticket.urgency && <Badge label={ticket.urgency} variant={ticket.urgency === 'emergency' ? 'red' : 'gray'} dot={ticket.urgency === 'emergency'} />}
              {ticket.category && <Badge label={ticket.category} variant="blue" />}
            </div>

            <h1 className="text-xl font-bold text-slate-900 mb-2">{ticket.description}</h1>
            <p className="text-xs text-slate-400 mb-6">
              Submitted on {new Date(ticket.created_at).toLocaleDateString()}
            </p>

            {ticket.contractor && (
              <div className="border-t border-slate-100 pt-5 mt-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Assigned Contractor</p>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                     {(ticket.contractor as any).company_name?.[0] || 'C'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{(ticket.contractor as any).company_name}</p>
                    <p className="text-xs text-slate-500">{(ticket.contractor as any).phone || 'No phone provided'}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <TicketChat ticketId={ticket.id} currentStatus={ticket.status} />
        </div>
      </div>
    </div>
  )
}
