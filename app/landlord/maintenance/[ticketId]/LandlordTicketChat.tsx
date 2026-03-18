'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function LandlordTicketChat({ ticketId, currentStatus }: { ticketId: string, currentStatus: string }) {
  const supabase = createClient()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('maintenance_messages')
        .select('*, profiles(full_name, role)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
    }

    fetchMessages()

    const sub = supabase.channel(`ticket_${ticketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'maintenance_messages', filter: `ticket_id=eq.${ticketId}` }, payload => {
        fetchMessages() // Re-fetch to get profile names
      }).subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [ticketId])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId) return
    await supabase.from('maintenance_messages').insert({
      ticket_id: ticketId,
      sender_id: currentUserId,
      body: newMessage.trim(),
    })
    setNewMessage('')
  }

  async function updateStatus(newStatus: string) {
    await supabase.from('maintenance_tickets').update({ status: newStatus }).eq('id', ticketId)
    window.location.reload()
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-sm font-semibold text-slate-800">Messages & Updates</h2>
        {currentStatus !== 'complete' && (
          <Button size="sm" variant="success" onClick={() => updateStatus('complete')}>
            Mark Complete
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isMe = m.sender_id === currentUserId
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-slate-400 mb-1 px-1">
                {isMe ? 'You' : m.profiles?.full_name}
                {m.profiles?.role === 'contractor' && ' (Contractor)'}
                {m.profiles?.role === 'tenant' && ' (Tenant)'}
              </span>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  isMe ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 text-slate-800'
                }`}
              >
                {m.body}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t border-slate-100 bg-white">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/30 focus:outline-none transition-all"
          />
          <Button type="submit" disabled={!newMessage.trim()}>Send</Button>
        </form>
      </div>
    </Card>
  )
}
