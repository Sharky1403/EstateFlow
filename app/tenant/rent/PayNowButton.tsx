'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function PayNowButton({ leaseId, amount }: { leaseId: string; amount: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unknown error')
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message ?? 'Failed to start payment. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <Button onClick={handlePay} loading={loading} className="w-full" size="lg">
        Pay ${amount.toLocaleString()} Now
      </Button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  )
}
