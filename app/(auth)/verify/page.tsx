'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function VerifyPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [file,     setFile]     = useState<File | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [error,    setError]    = useState('')

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const filePath = `identity-docs/${user.id}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('identity-docs')
      .upload(filePath, file)

    if (uploadError) { setError(uploadError.message); setLoading(false); return }

    const { data: urlData } = supabase.storage
      .from('identity-docs')
      .getPublicUrl(filePath)

    await supabase.from('profiles')
      .update({ id_document_url: urlData.publicUrl })
      .eq('id', user.id)

    setUploaded(true)
    setLoading(false)
  }

  const cardClass = 'bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.4)] p-8 border border-white/20 w-full max-w-md'

  if (uploaded) {
    return (
      <div className="animate-scale-in">
        <div className={cardClass}>
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl mx-auto mb-5 border border-emerald-100">
              ✅
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Identity Submitted</h2>
            <p className="text-slate-500 text-sm mt-2 mb-6">
              Your document has been uploaded. Your landlord will review it shortly.
            </p>
            <Button className="w-full" variant="gradient" size="lg" onClick={() => router.push('/tenant/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-scale-in p-6">
      <div className={cardClass}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">E</div>
          <span className="font-bold text-slate-900 text-base">EstateFlow</span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Identity Verification</h2>
        <p className="text-slate-500 text-sm mb-6">Upload a government-issued ID to complete your profile.</p>

        <div className="space-y-4">
          {/* Info box */}
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200/80 p-4">
            <span className="text-blue-500 text-base shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </span>
            <p className="text-sm text-blue-700">
              Please upload a clear photo of your national ID, passport, or driver's license.
            </p>
          </div>

          {/* File input */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              ID Document <span className="text-red-400 normal-case font-normal tracking-normal">required</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 px-4 transition-colors text-center ${
                file ? 'border-primary-300 bg-primary-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={file ? '#2563eb' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div>
                  <p className={`text-sm font-semibold ${file ? 'text-primary-700' : 'text-slate-600'}`}>
                    {file ? file.name : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'JPG, PNG or PDF — Max 10MB'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200/80 text-sm font-medium flex items-center gap-2 animate-scale-in">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <Button
            className="w-full"
            variant="gradient"
            size="lg"
            onClick={handleUpload}
            loading={loading}
            disabled={!file}
          >
            Upload & Continue
          </Button>

          <button
            onClick={() => router.push('/tenant/dashboard')}
            className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
