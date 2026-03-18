'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

interface Props {
  buildings: { id: string; name: string }[]
}

const CHANNELS = [
  { id: 'sms', label: 'SMS', icon: '💬', color: 'text-green-600 bg-green-50 border-green-200' },
  { id: 'push', label: 'Push', icon: '🔔', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'email', label: 'Email', icon: '✉️', color: 'text-purple-600 bg-purple-50 border-purple-200' },
]

export function BroadcastForm({ buildings }: Props) {
  const [buildingId, setBuildingId] = useState(buildings[0]?.id ?? '')
  const [body, setBody] = useState('')
  const [channels, setChannels] = useState<string[]>(['sms'])
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()

  async function send() {
    if (!body.trim() || channels.length === 0) return
    setLoading(true)
    await fetch('/api/communication/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ building_id: buildingId, body, sent_via: channels }),
    })
    setBody('')
    setLoading(false)
    setSent(true)
    setTimeout(() => setSent(false), 3000)
    router.refresh()
  }

  const toggleChannel = (ch: string) =>
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])

  return (
    <div className="space-y-6">
      {/* Building selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Target Building
        </label>
        {buildings.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No buildings found.</p>
        ) : (
          <select
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
            value={buildingId}
            onChange={e => setBuildingId(e.target.value)}
          >
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Message body */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Message
        </label>
        <textarea
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 h-36 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition placeholder:text-gray-400"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="e.g. Water will be shut off tomorrow from 9AM – 12PM for maintenance…"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{body.length} characters</p>
      </div>

      {/* Channel selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Send via
        </label>
        <div className="flex gap-3">
          {CHANNELS.map(ch => {
            const active = channels.includes(ch.id)
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => toggleChannel(ch.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                  active
                    ? ch.color + ' shadow-sm'
                    : 'border-gray-200 text-gray-400 bg-white hover:bg-gray-50'
                }`}
              >
                <span>{ch.icon}</span>
                {ch.label}
              </button>
            )
          })}
        </div>
        {channels.length === 0 && (
          <p className="text-xs text-red-400 mt-1.5">Select at least one channel.</p>
        )}
      </div>

      {/* Send button */}
      <Button
        onClick={send}
        loading={loading}
        disabled={!body.trim() || channels.length === 0}
        className="w-full py-3 text-sm font-semibold"
      >
        {sent ? '✓ Broadcast Sent!' : 'Send Broadcast'}
      </Button>
    </div>
  )
}
