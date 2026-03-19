'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { value: 'repairs',     label: 'Repairs & Maintenance' },
  { value: 'utilities',   label: 'Utilities' },
  { value: 'taxes',       label: 'Property Taxes' },
  { value: 'insurance',   label: 'Insurance' },
  { value: 'management',  label: 'Management Fees' },
  { value: 'legal',       label: 'Legal & Professional' },
  { value: 'other',       label: 'Other' },
]

interface Props {
  buildings: { id: string; name: string }[]
}

export function AddExpenseModal({ buildings }: Props) {
  const router = useRouter()
  const [open, setOpen]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [amount, setAmount]       = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory]   = useState('repairs')
  const [buildingId, setBuildingId] = useState(buildings[0]?.id ?? '')
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10))

  async function handleSubmit() {
    if (!amount || !description) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/finance/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), description, category, buildingId, date }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to log expense')
      setOpen(false)
      setAmount('')
      setDescription('')
      setCategory('repairs')
      setDate(new Date().toISOString().slice(0, 10))
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
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Log Expense
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Log an Expense" size="md">
        <div className="space-y-4">

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Plumber repair – Unit 4B"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>

          {/* Building */}
          {buildings.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Property
              </label>
              <select
                value={buildingId}
                onChange={e => setBuildingId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={!amount || !description}
              className="flex-1"
            >
              Save Expense
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
