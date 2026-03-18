'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function VerifyButton({ tenantId }: { tenantId: string }) {
  const supabase  = createClient()
  const router    = useRouter()
  const [loading, setLoading] = useState(false)

  async function update(status: 'approved' | 'rejected') {
    setLoading(true)
    await supabase.from('profiles').update({ kyc_status: status }).eq('id', tenantId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={loading}
        onClick={() => update('approved')}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
      >
        Approve
      </button>
      <button
        disabled={loading}
        onClick={() => update('rejected')}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  )
}
