'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

type Unit = { id: string; unit_number: string; building_name: string }

export function InviteButton({ units, preselectedUnitId }: { units: Unit[]; preselectedUnitId?: string }) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [form, setForm] = useState({
    email:     '',
    full_name: '',
    phone:     '',
    unit_id:   preselectedUnitId ?? units[0]?.id ?? '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/invite', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    const json = await res.json()

    setLoading(false)
    if (!res.ok) {
      setError(json.error ?? 'Failed to send invite')
      return
    }
    setSuccess(true)
  }

  function handleClose() {
    setOpen(false)
    setSuccess(false)
    setError(null)
    setForm({ email: '', full_name: '', phone: '', unit_id: preselectedUnitId ?? units[0]?.id ?? '' })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="primary" size="md">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
        Invite Tenant
      </Button>

      <Modal open={open} onClose={handleClose} title="Invite Tenant" size="sm">
        {success ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-800">Invite sent!</p>
            <p className="text-sm text-slate-400 mt-1 mb-6">
              {form.full_name} will receive an email{form.phone ? ' and SMS' : ''} with a link to complete their setup.
            </p>
            <Button onClick={handleClose} variant="outline" className="w-full">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Jane Smith"
              required
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="tenant@email.com"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone (optional — for SMS invite)"
              type="tel"
              placeholder="+1 555 000 0000"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />

            {!preselectedUnitId && units.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={form.unit_id}
                  onChange={e => setForm({ ...form, unit_id: e.target.value })}
                  required
                >
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unit_number} — {u.building_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
            )}

            <div className="pt-1 flex gap-3">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
              <Button type="submit" loading={loading} className="flex-1">Send Invite</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
