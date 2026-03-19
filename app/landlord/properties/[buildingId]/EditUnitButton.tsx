'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Unit = { id: string; unit_number: string; floor_number: number; market_rent: number; actual_rent: number }

export function EditUnitButton({ unit, buildingId }: { unit: Unit; buildingId: string }) {
  const [open, setOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [form, setForm] = useState({
    unit_number: unit.unit_number,
    floor_number: String(unit.floor_number),
    market_rent: String(unit.market_rent),
    actual_rent: String(unit.actual_rent),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.from('units').update({
      unit_number: form.unit_number,
      floor_number: Number(form.floor_number),
      market_rent: Number(form.market_rent),
      actual_rent: Number(form.actual_rent),
    }).eq('id', unit.id)
    setLoading(false)
    if (error) { setError(error.message); return }
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    setLoading(true)
    await supabase.from('units').delete().eq('id', unit.id)
    router.push(`/landlord/properties/${buildingId}`)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="md" onClick={() => setOpen(true)}>Edit Unit</Button>
        <Button variant="outline" size="md" onClick={() => setDeleteConfirm(true)}
          className="text-red-600 border-red-200 hover:bg-red-50">Delete</Button>
      </div>

      {/* Edit Modal */}
      <Modal open={open} onClose={() => { setOpen(false); setError(null) }} title="Edit Unit" size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Unit Number" value={form.unit_number} onChange={e => setForm({ ...form, unit_number: e.target.value })} required />
          <Input label="Floor Number" type="number" value={form.floor_number} onChange={e => setForm({ ...form, floor_number: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Market Rent ($)" type="number" value={form.market_rent} onChange={e => setForm({ ...form, market_rent: e.target.value })} required />
            <Input label="Actual Rent ($)" type="number" value={form.actual_rent} onChange={e => setForm({ ...form, actual_rent: e.target.value })} required />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Delete Unit" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <strong>Unit {unit.unit_number}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(false)} className="flex-1">Cancel</Button>
            <Button loading={loading} onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0">Delete</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
