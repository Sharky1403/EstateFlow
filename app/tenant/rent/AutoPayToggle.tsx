'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  autopayEnabled: boolean
  hasPaymentMethod: boolean
  leaseId: string
}

export function AutoPayToggle({ autopayEnabled: initial, hasPaymentMethod }: Props) {
  const [enabled, setEnabled] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleToggle() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const newState = !enabled

      // If enabling for the first time, set up a payment method via SetupIntent
      if (newState && !hasPaymentMethod) {
        const res = await fetch('/api/payments/setup-intent', { method: 'POST' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to set up payment method')

        // For a full implementation, mount Stripe Elements here using clientSecret.
        // For now, we inform the user to use the standard checkout to save their card.
        throw new Error('Please make a manual payment first to save your card on file, then enable auto-pay.')
      }

      const res = await fetch('/api/payments/autopay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autopayEnabled: newState }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update auto-pay')

      setEnabled(newState)
      setSuccess(newState ? 'Auto-pay enabled! Your rent will be charged automatically on the 1st of each month.' : 'Auto-pay disabled.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Auto-Pay</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {enabled
              ? 'Rent is charged automatically on the 1st of each month.'
              : 'Enable to automatically pay rent each month.'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative w-12 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
            enabled ? 'bg-primary-600' : 'bg-slate-200'
          } ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          aria-label={enabled ? 'Disable auto-pay' : 'Enable auto-pay'}
          title={enabled ? 'Disable auto-pay' : 'Enable auto-pay'}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
              enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {!hasPaymentMethod && !enabled && (
        <p className="text-xs text-amber-600 mt-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          Make your first manual payment to save a card on file, then enable auto-pay.
        </p>
      )}

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      {success && <p className="text-xs text-emerald-600 mt-2">{success}</p>}
    </div>
  )
}
