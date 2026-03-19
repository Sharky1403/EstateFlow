import { createClient } from '@/lib/supabase/server'
import { ReadReceiptTracker } from './ReadReceiptTracker'

export default async function TenantAnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, body, sent_via, created_at')
    .order('created_at', { ascending: false })

  const CHANNEL_STYLES: Record<string, string> = {
    sms: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    push: 'bg-blue-50 text-blue-700 border border-blue-200',
    email: 'bg-purple-50 text-purple-700 border border-purple-200',
  }

  return (
    <div className="space-y-4 page-enter">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Announcements</h1>
        <p className="text-sm text-slate-500 mt-0.5">Messages from your property manager.</p>
      </div>

      {/* Auto-mark announcements as read when the page loads */}
      {announcements && announcements.length > 0 && (
        <ReadReceiptTracker announcementIds={announcements.map(a => a.id)} />
      )}

      {!announcements || announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-12 text-center">
          <span className="text-4xl block mb-3">📭</span>
          <p className="text-slate-500 text-sm font-medium">No announcements yet</p>
          <p className="text-slate-400 text-xs mt-1">Your property manager&apos;s messages will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shrink-0">
                  📢
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 leading-relaxed">{a.body}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(a.sent_via ?? []).map((ch: string) => (
                      <span
                        key={ch}
                        className={`text-xs font-medium rounded-full px-2 py-0.5 ${CHANNEL_STYLES[ch] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {ch.toUpperCase()}
                      </span>
                    ))}
                    <span className="ml-auto text-xs text-slate-400">
                      {new Date(a.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
