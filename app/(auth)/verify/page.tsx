'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'

export default function VerifyPage() {
  const supabase = createClient()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [error, setError] = useState('')

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

  if (uploaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900">Identity Submitted</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Your document has been uploaded. Your landlord will review it shortly.
          </p>
          <Button className="w-full mt-6" onClick={() => router.push('/tenant/dashboard')}>
            Go to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">EstateFlow</h1>
          <p className="text-gray-500 mt-2">Identity Verification</p>
        </div>
        <Card>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
              📋 Please upload a clear photo of your national ID, passport, or driver's license.
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">ID Document *</label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-gray-400 mt-1">Accepted: JPG, PNG, PDF — Max 10MB</p>
            </div>
            {file && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-600">
                📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              className="w-full"
              onClick={handleUpload}
              loading={loading}
              disabled={!file}
            >
              Upload & Continue
            </Button>
            <button
              onClick={() => router.push('/tenant/dashboard')}
              className="w-full text-sm text-gray-400 hover:text-gray-600 text-center"
            >
              Skip for now
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
