import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import type { MaintenanceTicket } from '@/types/database'

const URGENCY_CONFIG = {
  emergency: { badge: 'red'    as const, dot: true,  icon: '🚨', bg: 'bg-red-50 border-red-200'   },
  high:      { badge: 'orange' as const, dot: false, icon: '⚠️',  bg: 'bg-orange-50 border-orange-200' },
  routine:   { badge: 'blue'   as const, dot: false, icon: '🔧', bg: 'bg-white border-slate-200'   },
  default:   { badge: 'gray'   as const, dot: false, icon: '🔧', bg: 'bg-white border-slate-200'   },
}

const STATUS_BADGE = {
  open:        'red'   as const,
  in_progress: 'blue'  as const,
  complete:    'green' as const,
}

function TicketCard({ ticket }: { ticket: MaintenanceTicket & { units: any } }) {
  const urgency = (ticket.urgency ?? 'default') as keyof typeof URGENCY_CONFIG
  const cfg = URGENCY_CONFIG[urgency] ?? URGENCY_CONFIG.default
  const statusVariant = STATUS_BADGE[ticket.status as keyof typeof STATUS_BADGE] ?? 'gray'

  return (
    <Link href={`/landlord/maintenance/${ticket.id}`}>
      <div className={`rounded-2xl border p-4 hover:shadow-card-md transition-all duration-200 cursor-pointer group ${cfg.bg}`}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-base shrink-0 shadow-sm">
            {cfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {ticket.description}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {ticket.units?.buildings?.name}
              {ticket.units?.unit_number ? ` — Unit ${ticket.units.unit_number}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {ticket.urgency && (
            <Badge label={ticket.urgency} variant={cfg.badge} dot={cfg.dot} />
          )}
          {ticket.category && (
            <Badge label={ticket.category} variant="blue" />
          )}
          <Badge label={ticket.status} variant={statusVariant} />
          <span className="ml-auto text-xs text-slate-400 group-hover:text-primary-600 transition-colors">
            View →
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function MaintenancePage() {
  const supabase = await createClient()
  const { data: tickets } = await supabase
    .from('maintenance_tickets')
    .select('*, units(unit_number, buildings(name))')
    .order('urgency', { ascending: false })
    .order('created_at', { ascending: false }) as { data: (MaintenanceTicket & { units: any })[] | null }

  const emergency = tickets?.filter(t => t.urgency === 'emergency') ?? []
  const others    = tickets?.filter(t => t.urgency !== 'emergency') ?? []
  const openCount = tickets?.filter(t => t.status === 'open').length ?? 0

  return (
    <div className="space-y-8 animate-fade-in">
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

      {emergency.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🚨</span>
            <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider">
              Emergency ({emergency.length})
            </h2>
          </div>
          <div className="space-y-3">
            {emergency.map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔧</span>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
            All Tickets ({others.length})
          </h2>
        </div>
        {others.length > 0 ? (
          <div className="space-y-3">
            {others.map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>
        ) : (
          <Card variant="flat">
            <div className="flex flex-col items-center py-10 text-center">
              <span className="text-3xl mb-2">✅</span>
              <p className="text-sm font-medium text-slate-500">All clear — no routine tickets</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
