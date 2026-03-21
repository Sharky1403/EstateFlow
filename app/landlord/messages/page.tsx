import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LandlordMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, created_at, tenant:profiles!conversations_tenant_id_fkey(full_name)')
    .eq('landlord_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-500 mt-1">Direct conversations with your tenants</p>
      </div>

      {(!conversations || conversations.length === 0) ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl mx-auto mb-4">💬</div>
          <h2 className="text-base font-semibold text-slate-700">No conversations yet</h2>
          <p className="text-sm text-slate-400 mt-1">Conversations will appear here when tenants message you.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card divide-y divide-slate-100 overflow-hidden">
          {conversations.map((conv: any) => {
            const name = conv.tenant?.full_name ?? 'Unknown Tenant'
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <Link
                key={conv.id}
                href={`/landlord/messages/${conv.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Tenant</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 shrink-0">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
