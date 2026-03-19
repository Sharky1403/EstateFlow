'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const OPTIONS = [
  { value: 'routine',   label: 'Routine',   icon: '🔧', color: 'border-slate-300 bg-slate-50 text-slate-600' },
  { value: 'high',      label: 'High',      icon: '⚠️',  color: 'border-orange-300 bg-orange-50 text-orange-600' },
  { value: 'emergency', label: 'Emergency', icon: '🚨', color: 'border-red-400 bg-red-50 text-red-600' },
] as const

export function UrgencyEditor({ ticketId, current }: { ticketId: string; current: string | null }) {
  const supabase = createClient()
  const router   = useRouter()
  const [saving, setSaving] = useState(false)

  async function setUrgency(value: string) {
    setSaving(true)
    await supabase.from('maintenance_tickets').update({ urgency: value }).eq('id', ticketId)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Priority</p>
      <div className="flex flex-col gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            disabled={saving}
            onClick={() => setUrgency(opt.value)}
            className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
              current === opt.value
                ? opt.color + ' ring-1 ring-offset-1 ring-current font-semibold'
                : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:text-slate-600'
            }`}
          >
            <span className="text-base">{opt.icon}</span>
            <span className="text-sm">{opt.label}</span>
            {current === opt.value && <span className="ml-auto text-xs">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
