import { createClient } from '@/lib/supabase/server'
import { BroadcastForm } from '@/components/communication/BroadcastForm'

export default async function CommunicationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: buildings } = await supabase
    .from('buildings')
    .select('id, name')
    .eq('landlord_id', user!.id)

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('landlord_id', user!.id)
    .order('created_at', { ascending: false })

  const CHANNEL_STYLES: Record<string, string> = {
    sms: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    push: 'bg-blue-50 text-blue-700 border border-blue-200',
    email: 'bg-purple-50 text-purple-700 border border-purple-200',
  }

  return (
    <div className="max-w-6xl mx-auto page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Communication</h1>
        <p className="text-sm text-slate-500 mt-1">
          Send announcements to tenants across your buildings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-lg">
                📢
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">New Broadcast</h2>
                <p className="text-xs text-slate-400">Reach all tenants instantly</p>
              </div>
            </div>
            <BroadcastForm buildings={buildings ?? []} />
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center text-lg">
                📋
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Sent Announcements</h2>
                <p className="text-xs text-slate-400">{announcements?.length ?? 0} messages total</p>
              </div>
            </div>

            {!announcements || announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-3">📭</span>
                <p className="text-sm font-medium text-slate-500">No announcements sent yet</p>
                <p className="text-xs text-slate-400 mt-1">Your broadcast history will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="group rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-sm p-4 transition-all"
                  >
                    <p className="text-sm text-slate-800 leading-relaxed">{a.body}</p>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <div className="flex gap-1.5 flex-wrap">
                        {(a.sent_via ?? []).map((ch: string) => (
                          <span
                            key={ch}
                            className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${CHANNEL_STYLES[ch] ?? 'bg-slate-100 text-slate-600'}`}
                          >
                            {ch.toUpperCase()}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(a.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
