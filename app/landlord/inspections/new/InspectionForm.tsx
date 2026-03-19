'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

interface Room {
  name: string
  condition: 'good' | 'fair' | 'poor'
  notes: string
  photo_url: string
}

interface Lease {
  id: string
  units: { unit_number: string; buildings: { name: string } | null } | null
  profiles: { full_name: string } | null
}

const CONDITION_STYLES = {
  good: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  fair: 'border-amber-400 bg-amber-50 text-amber-700',
  poor: 'border-red-400 bg-red-50 text-red-700',
}

export function InspectionForm({ leases }: { leases: Lease[] }) {
  const router = useRouter()
  const [leaseId, setLeaseId] = useState('')
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0])
  const [rooms, setRooms] = useState<Room[]>([
    { name: 'Living Room', condition: 'good', notes: '', photo_url: '' },
    { name: 'Kitchen', condition: 'good', notes: '', photo_url: '' },
    { name: 'Bathroom', condition: 'good', notes: '', photo_url: '' },
    { name: 'Bedroom', condition: 'good', notes: '', photo_url: '' },
  ])
  const [overallNotes, setOverallNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadingRoom, setUploadingRoom] = useState<number | null>(null)
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])

  const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5'
  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition'

  function addRoom() {
    setRooms(prev => [...prev, { name: '', condition: 'good', notes: '', photo_url: '' }])
  }

  function removeRoom(i: number) {
    setRooms(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateRoom(i: number, field: keyof Room, value: string) {
    setRooms(prev => {
      const updated = [...prev]
      updated[i] = { ...updated[i], [field]: value }
      return updated
    })
  }

  async function handlePhotoUpload(i: number, file: File) {
    setUploadingRoom(i)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `inspections/${leaseId || 'draft'}/${Date.now()}-room-${i}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('inspection-photos')
        .upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr

      const { data } = supabase.storage.from('inspection-photos').getPublicUrl(path)
      updateRoom(i, 'photo_url', data.publicUrl)
    } catch (err: any) {
      setError(`Photo upload failed: ${err.message}`)
    } finally {
      setUploadingRoom(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!leaseId) { setError('Please select a lease.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/inspections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseId, inspectionDate, rooms, overallNotes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create inspection')
      router.push('/landlord/inspections')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Lease</label>
          <select className={inputCls} value={leaseId} onChange={e => setLeaseId(e.target.value)} required>
            <option value="">Select a lease…</option>
            {leases.map(l => (
              <option key={l.id} value={l.id}>
                {l.profiles?.full_name} — {(l.units?.buildings as any)?.name} {l.units?.unit_number}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Inspection Date</label>
          <input type="date" className={inputCls} value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} required />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelCls + ' mb-0'}>Rooms</label>
          <button type="button" onClick={addRoom} className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors">
            + Add Room
          </button>
        </div>
        <div className="space-y-4">
          {rooms.map((room, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  className={inputCls + ' flex-1'}
                  value={room.name}
                  onChange={e => updateRoom(i, 'name', e.target.value)}
                  placeholder="Room name (e.g. Master Bedroom)"
                  required
                />
                <button type="button" onClick={() => removeRoom(i)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0">
                  ×
                </button>
              </div>

              <div>
                <label className={labelCls}>Condition</label>
                <div className="flex gap-2">
                  {(['good', 'fair', 'poor'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateRoom(i, 'condition', c)}
                      className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all ${
                        room.condition === c ? CONDITION_STYLES[c] : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  className={inputCls + ' resize-none'}
                  rows={2}
                  value={room.notes}
                  onChange={e => updateRoom(i, 'notes', e.target.value)}
                  placeholder="Describe the condition, any damage, etc."
                />
              </div>

              <div>
                <label className={labelCls}>Photo</label>
                <input
                  ref={el => { fileRefs.current[i] = el }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handlePhotoUpload(i, e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={() => fileRefs.current[i]?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition px-4 py-3 text-sm text-slate-500 text-center"
                  disabled={uploadingRoom === i}
                >
                  {uploadingRoom === i ? (
                    <span className="text-primary-600">Uploading…</span>
                  ) : room.photo_url ? (
                    <span className="text-emerald-600 font-medium">✓ Photo uploaded — click to replace</span>
                  ) : (
                    <span>Click to upload room photo</span>
                  )}
                </button>
                {room.photo_url && (
                  <img src={room.photo_url} alt={room.name} className="mt-2 w-full h-32 object-cover rounded-xl border border-slate-200" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Overall Notes</label>
        <textarea
          className={inputCls + ' resize-none'}
          rows={3}
          value={overallNotes}
          onChange={e => setOverallNotes(e.target.value)}
          placeholder="General observations about the property condition at move-in…"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading} size="lg">
          Save Inspection Report
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
