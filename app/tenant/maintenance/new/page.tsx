'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const schema = z.object({ description: z.string().min(10, 'Please describe the issue in detail') })
type FormData = z.infer<typeof schema>

const DRAFT_KEY = 'maintenance_draft'

export default function NewTicketPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [urgency,      setUrgency]      = useState<'routine' | 'high' | 'emergency'>('routine')
  const [photoFile,    setPhotoFile]    = useState<File | null>(null)
  const [isOnline,     setIsOnline]     = useState(true)
  const [isRecording,  setIsRecording]  = useState(false)
  const [audioBlob,    setAudioBlob]    = useState<Blob | null>(null)
  const [transcribing, setTranscribing] = useState(false)
  const [transcribed,  setTranscribed]  = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef        = useRef<Blob[]>([])

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  // Restore draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) setValue('description', draft)
  }, [setValue])

  // Online / offline tracking + auto-sync on reconnect
  useEffect(() => {
    setIsOnline(navigator.onLine)

    const onOnline = () => {
      setIsOnline(true)
      // Auto-submit if there's a saved draft waiting
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft && draft.length >= 10) {
        setValue('description', draft)
        // Small delay to let React update the form value before submitting
        setTimeout(() => {
          document.getElementById('maintenance-submit-btn')?.click()
        }, 300)
      }
    }

    const onOffline = () => setIsOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [setValue])

  function saveDraft(val: string) { localStorage.setItem(DRAFT_KEY, val) }

  // ── Voice recording ────────────────────────────────────────
  async function startRecording() {
    chunksRef.current = []
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      stream.getTracks().forEach(t => t.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setAudioBlob(blob)
    }
    mr.start()
    mediaRecorderRef.current = mr
    setIsRecording(true)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  async function transcribeAudio() {
    if (!audioBlob) return
    setTranscribing(true)
    try {
      const fd = new FormData()
      fd.append('audio', new File([audioBlob], 'voice.webm', { type: 'audio/webm' }))
      const res  = await fetch('/api/maintenance/transcribe', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.text) {
        const current = watch('description')
        const merged  = current ? `${current}\n\n${json.text}` : json.text
        setValue('description', merged)
        saveDraft(merged)
        setTranscribed(true)
      }
    } finally {
      setTranscribing(false)
    }
  }

  // ── Submit ─────────────────────────────────────────────────
  async function onSubmit(data: FormData) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: lease }    = await supabase.from('leases').select('unit_id').eq('tenant_id', user!.id).single()

    let photo_url     = null
    let voice_note_url = null

    if (photoFile) {
      const { data: upload } = await supabase.storage
        .from('maintenance-photos')
        .upload(`${user!.id}/${Date.now()}_${photoFile.name}`, photoFile)
      if (upload) {
        const { data: urlData } = supabase.storage.from('maintenance-photos').getPublicUrl(upload.path)
        photo_url = urlData.publicUrl
      }
    }

    if (audioBlob) {
      const audioFile = new File([audioBlob], `${Date.now()}_voice.webm`, { type: 'audio/webm' })
      const { data: upload } = await supabase.storage
        .from('maintenance-photos')
        .upload(`${user!.id}/voice/${audioFile.name}`, audioFile)
      if (upload) {
        const { data: urlData } = supabase.storage.from('maintenance-photos').getPublicUrl(upload.path)
        voice_note_url = urlData.publicUrl
      }
    }

    const { data: ticket } = await supabase.from('maintenance_tickets').insert({
      tenant_id: user!.id,
      unit_id: lease?.unit_id,
      description: data.description,
      photo_url,
      voice_note_url,
      urgency,
      status: 'open',
    }).select('id').single()

    // Run AI triage in background — updates urgency + category automatically
    if (ticket?.id) {
      fetch('/api/maintenance/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticket.id, description: data.description }),
      }).catch(() => {}) // fire-and-forget, non-blocking
    }

    localStorage.removeItem(DRAFT_KEY)
    router.push('/tenant/maintenance')
  }

  return (
    <div className="space-y-4 page-enter">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Report an Issue</h1>
        <p className="text-sm text-slate-500 mt-0.5">Describe the problem and we'll notify your landlord.</p>
      </div>

      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200/80 px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M1 6s4-4 11-4 11 4 11 4"/><path d="M1 12s4-4 11-4 11 4 11 4"/>
            <line x1="2" y1="20" x2="22" y2="20"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
          <p className="text-sm text-amber-700 font-medium">
            You're offline. Draft saved — will submit automatically when connection is restored.
          </p>
        </div>
      )}

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Describe the issue <span className="text-red-400 normal-case font-normal tracking-normal">required</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 h-32 resize-none transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 hover:border-slate-300"
              placeholder="e.g. The kitchen sink is leaking under the cabinet..."
              {...register('description')}
              onChange={e => {
                register('description').onChange(e)
                saveDraft(e.target.value)
              }}
            />
            {errors.description && (
              <p className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                <span className="shrink-0">⚠</span> {errors.description.message}
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'routine',   label: 'Routine',   icon: '🔧', desc: 'Non-urgent',       active: 'border-slate-400 bg-slate-50 text-slate-700' },
                { value: 'high',      label: 'High',      icon: '⚠️',  desc: 'Needs attention',  active: 'border-orange-400 bg-orange-50 text-orange-700' },
                { value: 'emergency', label: 'Emergency', icon: '🚨', desc: 'Immediate danger',  active: 'border-red-500 bg-red-50 text-red-700' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUrgency(opt.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 px-2 transition-all text-center ${
                    urgency === opt.value ? opt.active + ' ring-1 ring-offset-1 ring-current' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs font-bold">{opt.label}</span>
                  <span className="text-[10px] leading-tight opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Voice recorder */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Voice Note <span className="text-slate-400 normal-case font-normal tracking-normal">(optional — auto-transcribes)</span>
            </label>
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-sm font-medium text-slate-500 hover:text-primary-700"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                  {audioBlob ? 'Re-record' : 'Record voice note'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border-2 border-red-300 text-red-600 font-semibold text-sm animate-pulse"
                >
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
                  Stop recording
                </button>
              )}

              {audioBlob && !isRecording && (
                <button
                  type="button"
                  onClick={transcribeAudio}
                  disabled={transcribing}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    transcribed
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100'
                  }`}
                >
                  {transcribing ? (
                    <>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeDasharray="56" strokeDashoffset="14"/>
                      </svg>
                      Transcribing...
                    </>
                  ) : transcribed ? (
                    <><span>✓</span> Transcribed</>
                  ) : (
                    <><span>✨</span> Transcribe</>
                  )}
                </button>
              )}
            </div>
            {audioBlob && !isRecording && (
              <p className="text-xs text-slate-400 mt-1.5">Voice note recorded — will be attached to the ticket.</p>
            )}
          </div>

          {/* Photo upload */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Attach Photo <span className="text-slate-400 normal-case font-normal tracking-normal">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className={`flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3.5 transition-colors ${
                photoFile ? 'border-primary-300 bg-primary-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={photoFile ? '#2563eb' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <div>
                  <p className={`text-sm font-medium ${photoFile ? 'text-primary-700' : 'text-slate-500'}`}>
                    {photoFile ? photoFile.name : 'Tap to add a photo'}
                  </p>
                  {photoFile && (
                    <p className="text-xs text-slate-400">{(photoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button
            id="maintenance-submit-btn"
            type="submit"
            loading={isSubmitting}
            className="w-full"
            variant="gradient"
            size="lg"
            disabled={!isOnline}
          >
            {isOnline ? 'Submit Request' : 'Waiting for connection…'}
          </Button>
        </form>
      </div>
    </div>
  )
}
