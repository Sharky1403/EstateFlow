'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export function DirectChat({
  conversationId,
  tenantName,
}: {
  conversationId: string
  tenantName: string
}) {
  const supabase = createClient()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*, profiles(full_name, role)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
    }

    fetchMessages()

    const sub = supabase
      .channel(`conversation_${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => fetchMessages())
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId) return
    await supabase.from('direct_messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: newMessage.trim(),
    })
    setNewMessage('')
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden" style={{ height: 'calc(100vh - 260px)', minHeight: '400px' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {tenantName[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{tenantName}</p>
          <p className="text-xs text-slate-400">Tenant</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl mb-3">💬</div>
            <p className="text-sm font-medium text-slate-600">No messages yet</p>
            <p className="text-xs text-slate-400 mt-1">Start a conversation with {tenantName}</p>
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.sender_id === currentUserId
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-slate-400 mb-1 px-1">
                {isMe ? 'You' : m.profiles?.full_name}
                {!isMe && ' · Tenant'}
              </span>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                isMe ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-800'
              }`}>
                {m.body}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          />
          <Button type="submit" disabled={!newMessage.trim()}>Send</Button>
        </form>
      </div>
    </div>
  )
}
