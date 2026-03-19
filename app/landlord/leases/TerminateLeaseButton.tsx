'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

interface Props {
  lease: {
    id: string
    break_fee?: number | null
    break_fee_description?: string | null
  }
}

export function TerminateLeaseButton({ lease }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleTerminate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/leases/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseId: lease.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to terminate lease')
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-red-500 font-medium hover:underline whitespace-nowrap"
      >
        Terminate
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Terminate Lease" size="sm">
        <div className="space-y-4">
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            This will immediately terminate the lease and mark the unit as vacant. This action cannot be undone.
          </div>

          {lease.break_fee && Number(lease.break_fee) > 0 ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold">Lease break fee: ${Number(lease.break_fee).toLocaleString()}</p>
              {lease.break_fee_description && (
                <p className="text-xs mt-1 text-amber-700">{lease.break_fee_description}</p>
              )}
              <p className="text-xs mt-1 text-amber-600">This fee will be recorded as a pending invoice in the ledger.</p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No lease break fee is configured for this lease.</p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleTerminate} loading={loading}>
              Terminate Lease
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
