import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DirectChat } from '../DirectChat'

interface Props {
  params: Promise<{ conversationId: string }>
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, tenant:profiles!conversations_tenant_id_fkey(full_name)')
    .eq('id', conversationId)
    .eq('landlord_id', user!.id)
    .single()

  if (!conversation) notFound()

  const tenantName = (conversation as any).tenant?.full_name ?? 'Tenant'

  return (
    <div className="max-w-3xl mx-auto page-enter space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/landlord/messages"
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{tenantName}</h1>
          <p className="text-sm text-slate-500">Direct message</p>
        </div>
      </div>

      <DirectChat conversationId={conversationId} tenantName={tenantName} />
    </div>
  )
}
