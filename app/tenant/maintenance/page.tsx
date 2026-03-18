import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

export default async function TenantMaintenancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tickets } = await supabase
    .from('maintenance_tickets')
    .select('*')
    .eq('tenant_id', user!.id)
    .order('created_at', { ascending: false })

  const open       = tickets?.filter(t => t.status !== 'complete').length ?? 0
  const completed  = tickets?.filter(t => t.status === 'complete').length ?? 0

  return (
    <div className="space-y-4 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-sm text-slate-500 mt-0.5">{open} open · {completed} completed</p>
        </div>
        <Link
          href="/tenant/maintenance/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-b from-primary-500 to-primary-600 text-white text-xs font-semibold shadow-sm hover:from-primary-400 hover:to-primary-500 transition-all duration-150 active:scale-95"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Request
        </Link>
      </div>

      {/* Ticket list */}
      {!tickets || tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
          <p className="text-slate-600 font-semibold text-sm">No issues reported</p>
          <p className="text-slate-400 text-xs mt-1 mb-5">Submit a request if something needs attention.</p>
          <Link
            href="/tenant/maintenance/new"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            + Report an issue
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card divide-y divide-slate-100 overflow-hidden">
          {tickets.map(t => (
            <Link
              key={t.id}
              href={`/tenant/maintenance/${t.id}`}
              className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              {/* Status icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                t.urgency === 'emergency' ? 'bg-red-50' :
                t.status === 'complete'  ? 'bg-emerald-50' :
                'bg-orange-50'
              }`}>
                {t.urgency === 'emergency' ? (
                  <span className="text-sm">🚨</span>
                ) : t.status === 'complete' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 text-sm font-medium line-clamp-2">{t.description}</p>
                <p className="text-slate-400 text-xs mt-1">
                  {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                {t.urgency && (
                  <Badge label={t.urgency} variant={t.urgency === 'emergency' ? 'red' : t.urgency === 'high' ? 'orange' : 'gray'} />
                )}
                <Badge
                  label={t.status}
                  variant={t.status === 'complete' ? 'green' : t.status === 'in_progress' ? 'blue' : 'yellow'}
                  dot
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
