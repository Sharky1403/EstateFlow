'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function TicketChat({ ticketId, currentStatus }: { ticketId: string, currentStatus: string }) {
  const supabase = createClient()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completionPhoto, setCompletionPhoto] = useState<File | null>(null)
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        fetchMessages()
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

  async function handleMarkComplete() {
    setCompleting(true)
    setCompleteError('')
    try {
      let photoUrl: string | null = null

      if (completionPhoto) {
        const ext = completionPhoto.name.split('.').pop()
        const path = `completion/${ticketId}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('maintenance')
          .upload(path, completionPhoto, { upsert: true })
        if (uploadError) throw new Error(uploadError.message)
        const { data: urlData } = supabase.storage.from('maintenance').getPublicUrl(path)
        photoUrl = urlData.publicUrl
      }

      const updates: Record<string, any> = { status: 'complete' }
      if (photoUrl) updates.completion_photo_url = photoUrl

      await supabase.from('maintenance_tickets').update(updates).eq('id', ticketId)
      window.location.reload()
    } catch (err: any) {
      setCompleteError(err.message)
      setCompleting(false)
    }
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-sm font-semibold text-slate-800">Job Updates</h2>
        {currentStatus !== 'complete' && (
          <Button size="sm" variant="success" onClick={() => setShowCompleteModal(true)}>
            Mark Complete
          </Button>
        )}
      </div>

      {/* Complete modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4 animate-scale-in">
            <h3 className="text-sm font-bold text-slate-800">Mark Job Complete</h3>
            <p className="text-xs text-slate-500">Upload a photo of the completed work (optional but recommended).</p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
            >
              {completionPhoto ? (
                <div>
                  <p className="text-sm font-medium text-slate-700 truncate">{completionPhoto.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{(completionPhoto.size / 1024).toFixed(0)} KB</p>
                </div>
              ) : (
                <div>
                  <svg className="mx-auto mb-2 text-slate-300" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p className="text-xs text-slate-400">Tap to add completion photo</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => setCompletionPhoto(e.target.files?.[0] ?? null)}
              />
            </div>

            {completeError && <p className="text-xs text-red-500">{completeError}</p>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCompleteModal(false)} className="flex-1">Cancel</Button>
              <Button variant="success" onClick={handleMarkComplete} loading={completing} className="flex-1">
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isMe = m.sender_id === currentUserId
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-slate-400 mb-1 px-1">
                {isMe ? 'You' : m.profiles?.full_name}
                {m.profiles?.role === 'landlord' && ' (Manager)'}
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
            disabled={currentStatus === 'complete'}
            onChange={e => setNewMessage(e.target.value)}
            placeholder={currentStatus === 'complete' ? "Job marked complete." : "Add a job update..."}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/30 focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
          />
          <Button type="submit" disabled={!newMessage.trim() || currentStatus === 'complete'}>Send</Button>
        </form>
      </div>
    </Card>
  )
}
