'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface Unit { id: string; unit_number: string; actual_rent: number; buildings: { name: string } | { name: string }[] | null }
interface Tenant { id: string; full_name: string; email: string }

export function NewLeaseForm({
  units,
  tenants,
  defaultUnitId,
}: {
  units: Unit[]
  tenants: Tenant[]
  defaultUnitId?: string
}) {
  const router = useRouter()
  const [unitId, setUnitId] = useState(defaultUnitId ?? '')
  const [tenantId, setTenantId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [clauses, setClauses] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-fill rent from unit selection
  function handleUnitChange(id: string) {
    setUnitId(id)
    const unit = units.find(u => u.id === id)
    if (unit?.actual_rent) setMonthlyRent(String(unit.actual_rent))
  }

  // Prorated rent preview
  const proratedPreview = useMemo(() => {
    if (!startDate || !monthlyRent) return null
    const d = new Date(startDate)
    if (d.getDate() === 1) return null
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    const remaining = daysInMonth - d.getDate() + 1
    const prorated = Math.round((Number(monthlyRent) / daysInMonth) * remaining * 100) / 100
    return { prorated, remaining, daysInMonth }
  }, [startDate, monthlyRent])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/leases/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          tenantId,
          startDate,
          endDate,
          monthlyRent: Number(monthlyRent),
          clauses: clauses ? clauses.split('\n').filter(Boolean).map(text => ({ text })) : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create lease')
      router.push('/landlord/leases')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5'
  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Unit</label>
          <select className={inputCls} value={unitId} onChange={e => handleUnitChange(e.target.value)} required>
            <option value="">Select a unit…</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>
                {Array.isArray(u.buildings) ? u.buildings[0]?.name : u.buildings?.name} — {u.unit_number}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Tenant</label>
          <select className={inputCls} value={tenantId} onChange={e => setTenantId(e.target.value)} required>
            <option value="">Select a tenant…</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Start Date (Move-in)</label>
          <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>

        <div>
          <label className={labelCls}>End Date</label>
          <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} required />
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Monthly Rent ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputCls}
            value={monthlyRent}
            onChange={e => setMonthlyRent(e.target.value)}
            placeholder="e.g. 1500"
            required
          />
          {proratedPreview && (
            <p className="mt-1.5 text-xs text-amber-600 font-medium">
              Move-in on day {new Date(startDate).getDate()} — prorated first month: <strong>${proratedPreview.prorated.toLocaleString()}</strong> ({proratedPreview.remaining}/{proratedPreview.daysInMonth} days)
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Custom Clauses <span className="font-normal text-slate-400 normal-case">(one per line, e.g. "No Pets")</span></label>
          <textarea
            className={inputCls + ' resize-none'}
            rows={4}
            value={clauses}
            onChange={e => setClauses(e.target.value)}
            placeholder={"No Pets\nNo Smoking\nTenant responsible for utilities"}
          />
        </div>
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
        A security deposit equal to 1 month's rent will be recorded automatically as a held deposit.
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={loading} size="lg">
          Create Lease
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
