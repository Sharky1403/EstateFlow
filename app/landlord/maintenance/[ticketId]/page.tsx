import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LandlordTicketChat } from './LandlordTicketChat'
import { AssignContractorButton } from './AssignContractorButton'
import { UrgencyEditor } from './UrgencyEditor'

export default async function MaintenanceTicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  // Get ticket details
  const { data: ticket } = await supabase
    .from('maintenance_tickets')
    .select('*, units(unit_number, buildings(name)), profiles!tenant_id(full_name, phone)')
    .eq('id', resolvedParams.ticketId)
    .single()

  if (!ticket) return notFound()

  // Get contractors for assignment (with insurance data)
  const { data: contractors } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, specialties, contractor_insurance(expiry_date, policy_document_url)')
    .eq('role', 'contractor')

  const isEmergency = ticket.urgency === 'emergency'

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/landlord/maintenance" className="hover:text-primary-600">Maintenance</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Ticket #{ticket.id.slice(0, 8)}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Col: Details */}
        <div className="flex-1 space-y-6">
          <Card padding="lg" variant={isEmergency ? 'bordered' : 'elevated'} className={isEmergency ? 'border-red-200 bg-red-50/30' : ''}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isEmergency ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                  {isEmergency ? '🚨' : '🔧'}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{ticket.description}</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Reported {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <Badge label={ticket.status} variant={ticket.status === 'open' ? 'red' : ticket.status === 'complete' ? 'green' : 'blue'} />
              {ticket.urgency && <Badge label={ticket.urgency} variant={isEmergency ? 'red' : 'gray'} dot={isEmergency} />}
              {ticket.category && <Badge label={ticket.category} variant="blue" />}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Property</p>
                <p className="text-sm text-slate-900 font-medium mt-1">
                  {(ticket.units as any)?.buildings?.name}
                  {(ticket.units as any)?.unit_number ? ` — Unit ${(ticket.units as any).unit_number}` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Tenant</p>
                <p className="text-sm text-slate-900 font-medium mt-1">
                  {(ticket.profiles as any)?.full_name ?? 'Unknown'}
                </p>
              </div>
            </div>
          </Card>

          {/* Chat Component */}
          <LandlordTicketChat ticketId={ticket.id} currentStatus={ticket.status} />
        </div>

        {/* Right Col: Assignment + Priority */}
        <div className="w-full md:w-80 space-y-4">
          <UrgencyEditor ticketId={ticket.id} current={ticket.urgency} />
          <AssignContractorButton
            ticketId={ticket.id}
            currentContractorId={ticket.contractor_id}
            contractors={contractors || []}
          />
        </div>
      </div>
    </div>
  )
}
