'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

type Ticket = {
  id: string
  description: string
  urgency: string | null
  category: string | null
  status: string
  units?: { unit_number?: string; buildings?: { name?: string } } | null
}

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

const URGENCY_ORDER: Record<string, number> = { emergency: 0, high: 1, routine: 2 }

const TABS = [
  { key: 'all',         label: 'All' },
  { key: 'open',        label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'complete',    label: 'Complete' },
]

function TicketCard({ ticket }: { ticket: Ticket }) {
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

export function FilterTabs({ tickets }: { tickets: Ticket[] }) {
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'complete'>('all')

  const filtered = activeTab === 'all'
    ? tickets
    : tickets.filter(t => t.status === activeTab)

  const sorted = [...filtered].sort((a, b) => {
    const ua = URGENCY_ORDER[a.urgency ?? ''] ?? 3
    const ub = URGENCY_ORDER[b.urgency ?? ''] ?? 3
    return ua - ub
  })

  const emergency = sorted.filter(t => t.urgency === 'emergency')
  const others    = sorted.filter(t => t.urgency !== 'emergency')

  const counts: Record<string, number> = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    complete: tickets.filter(t => t.status === 'complete').length,
  }

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 ${activeTab === tab.key ? 'text-white/70' : 'text-slate-400'}`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Emergency section */}
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

      {/* Other tickets */}
      <div>
        {emergency.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔧</span>
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
              Other Tickets ({others.length})
            </h2>
          </div>
        )}
        {others.length > 0 ? (
          <div className="space-y-3">
            {others.map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>
        ) : emergency.length === 0 ? (
          <Card variant="flat">
            <div className="flex flex-col items-center py-10 text-center">
              <span className="text-3xl mb-2">✅</span>
              <p className="text-sm font-medium text-slate-500">
                {activeTab === 'all' ? 'No tickets yet' : `No ${activeTab.replace('_', ' ')} tickets`}
              </p>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
