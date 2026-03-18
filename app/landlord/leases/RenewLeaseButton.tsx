'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export function RenewLeaseButton({ lease }: { lease: any }) {
  const supabase = createClient()
  const router   = useRouter()
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [months,  setMonths]  = useState(12)
  const [rent,    setRent]    = useState<number>(Number(lease.monthly_rent))
  const [error,   setError]   = useState('')

  async function renew() {
    setLoading(true)
    setError('')
    try {
      const newStart = new Date(lease.end_date)
      newStart.setDate(newStart.getDate() + 1)
      const newEnd = new Date(newStart)
      newEnd.setMonth(newEnd.getMonth() + months)

      const { error: err } = await supabase
        .from('leases')
        .update({
          start_date: newStart.toISOString().slice(0, 10),
          end_date:   newEnd.toISOString().slice(0, 10),
          monthly_rent: rent,
          status: 'active',
          signed_at: new Date().toISOString(),
        })
        .eq('id', lease.id)

      if (err) throw err
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const newStart = new Date(lease.end_date)
  newStart.setDate(newStart.getDate() + 1)
  const newEnd = new Date(newStart)
  newEnd.setMonth(newEnd.getMonth() + months)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-violet-600 font-medium hover:underline whitespace-nowrap"
      >
        Renew
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
            <h3 className="text-base font-bold text-slate-900 mb-1">Renew Lease</h3>
            <p className="text-sm text-slate-500 mb-5">
              Tenant: <span className="font-medium text-slate-700">{lease.profiles?.full_name}</span>
            </p>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                  value={months}
                  onChange={e => setMonths(Number(e.target.value))}
                >
                  {[6, 12, 18, 24].map(m => (
                    <option key={m} value={m}>{m} months</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Rent ($)</label>
                <input
                  type="number"
                  value={rent}
                  onChange={e => setRent(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-500 space-y-1">
                <p><span className="font-semibold">New start:</span> {newStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p><span className="font-semibold">New end:</span>   {newEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>

              {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
              )}

              <div className="flex gap-3">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="gradient" size="sm" className="flex-1" loading={loading} onClick={renew}>
                  Confirm Renewal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
