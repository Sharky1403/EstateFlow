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
  const [clauses, setClauses] = useState<{ title: string; body: string }[]>([])
  const [breakFee, setBreakFee] = useState('')
  const [breakFeeDescription, setBreakFeeDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')

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
          clauses,
          breakFee: breakFee ? Number(breakFee) : 0,
          breakFeeDescription,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create lease')
      if (data.lease?.pdf_url) {
        setPdfUrl(data.lease.pdf_url)
      } else {
        router.push('/landlord/leases')
        router.refresh()
      }
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
          <label className={labelCls}>Lease Break Fee ($) <span className="font-normal text-slate-400 normal-case">(charged if tenant terminates early)</span></label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={breakFee}
              onChange={e => setBreakFee(e.target.value)}
              placeholder="e.g. 1500 (0 = none)"
            />
            <input
              type="text"
              className={inputCls}
              value={breakFeeDescription}
              onChange={e => setBreakFeeDescription(e.target.value)}
              placeholder="e.g. 2 months rent penalty"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className={labelCls}>Custom Clauses</label>
            <button
              type="button"
              onClick={() => setClauses(prev => [...prev, { title: '', body: '' }])}
              className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors flex items-center gap-1"
            >
              <span className="text-base leading-none">+</span> Add Clause
            </button>
          </div>
          {clauses.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-xl">
              No custom clauses. Click "Add Clause" to add one.
            </p>
          ) : (
            <div className="space-y-3">
              {clauses.map((clause, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className={inputCls + ' flex-1'}
                      value={clause.title}
                      onChange={e => {
                        const updated = [...clauses]
                        updated[i] = { ...updated[i], title: e.target.value }
                        setClauses(updated)
                      }}
                      placeholder={`Clause title (e.g. No Pets)`}
                    />
                    <button
                      type="button"
                      onClick={() => setClauses(prev => prev.filter((_, idx) => idx !== i))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                      title="Remove clause"
                    >
                      ×
                    </button>
                  </div>
                  <textarea
                    className={inputCls + ' resize-none'}
                    rows={2}
                    value={clause.body}
                    onChange={e => {
                      const updated = [...clauses]
                      updated[i] = { ...updated[i], body: e.target.value }
                      setClauses(updated)
                    }}
                    placeholder="Describe the clause details…"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
        A security deposit equal to 1 month's rent will be recorded automatically as a held deposit.
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {pdfUrl ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg shrink-0">📄</div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Lease created & PDF generated!</p>
              <p className="text-xs text-emerald-600 mt-0.5">The lease document is ready to download or share with the tenant.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg transition-colors"
            >
              Download PDF
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </a>
            <Button type="button" variant="outline" size="sm" onClick={() => { router.push('/landlord/leases'); router.refresh() }}>
              View All Leases
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" loading={loading} size="lg">
            Create Lease
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  )
}
