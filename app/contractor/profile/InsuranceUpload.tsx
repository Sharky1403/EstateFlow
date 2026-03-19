'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

interface Props {
  contractorId: string
  current: { expiry_date: string; policy_document_url: string } | null
}

export function InsuranceUpload({ contractorId, current }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [expiryDate, setExpiryDate] = useState(current?.expiry_date ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition'

  const isExpired = current?.expiry_date
    ? new Date(current.expiry_date) < new Date()
    : false

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!expiryDate) { setError('Please set an expiry date.'); return }
    if (!file && !current?.policy_document_url) { setError('Please upload your insurance document.'); return }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()
      let docUrl = current?.policy_document_url ?? ''

      if (file) {
        const ext = file.name.split('.').pop()
        const path = `insurance/${contractorId}/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('contractor-docs')
          .upload(path, file, { upsert: true })
        if (uploadErr) throw uploadErr

        const { data: urlData } = supabase.storage.from('contractor-docs').getPublicUrl(path)
        docUrl = urlData.publicUrl
      }

      const { error: dbErr } = await supabase
        .from('contractor_insurance')
        .upsert({
          contractor_id: contractorId,
          policy_document_url: docUrl,
          expiry_date: expiryDate,
        }, { onConflict: 'contractor_id' })

      if (dbErr) throw dbErr

      setSuccess('Insurance details saved successfully.')
      setFile(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'Failed to save insurance details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {current && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${isExpired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {isExpired ? (
            <>
              <span className="font-bold">Insurance Expired</span> — Your policy expired on {new Date(current.expiry_date).toLocaleDateString()}. You won&apos;t be assignable to jobs until you update it.
            </>
          ) : (
            <>
              <span className="font-bold">Active Insurance</span> — Your policy is valid until {new Date(current.expiry_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
            </>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Policy Expiry Date
        </label>
        <input
          type="date"
          className={inputCls}
          value={expiryDate}
          onChange={e => setExpiryDate(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Insurance Document (PDF)
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition px-4 py-4 text-sm text-slate-500 text-center"
        >
          {file ? (
            <span className="text-primary-600 font-medium">{file.name}</span>
          ) : current?.policy_document_url ? (
            <span>Current document on file — click to replace</span>
          ) : (
            <span>Click to upload insurance document</span>
          )}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <Button type="submit" loading={loading} variant="primary">
        Save Insurance Details
      </Button>
    </form>
  )
}
