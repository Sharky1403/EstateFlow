'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useRouter } from 'next/navigation'

export function NewUnitButton({ buildingId }: { buildingId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const [form, setForm] = useState({
    unit_number: '',
    market_rent: '',
    beds: '',
    baths: '',
    sqft: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await supabase.from('units').insert({
      building_id: buildingId,
      unit_number: form.unit_number,
      market_rent: Number(form.market_rent) || 0,
      actual_rent: Number(form.market_rent) || 0, // Default to market rent initially
      beds: Number(form.beds) || null,
      baths: Number(form.baths) || null,
      sqft: Number(form.sqft) || null,
      occupied: false,
    })

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="md">
        <span className="text-base leading-none">+</span> Add Unit
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add New Unit" size="md">
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            label="Unit Number"
            placeholder="e.g. 101, Apt B"
            required
            value={form.unit_number}
            onChange={e => setForm({ ...form, unit_number: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Market Rent ($)"
              type="number"
              placeholder="e.g. 2500"
              required
              value={form.market_rent}
              onChange={e => setForm({ ...form, market_rent: e.target.value })}
            />
            <Input
              label="Square Feet"
              type="number"
              placeholder="e.g. 850"
              value={form.sqft}
              onChange={e => setForm({ ...form, sqft: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
               label="Bedrooms"
               type="number"
               step="0.5"
               placeholder="e.g. 2"
               value={form.beds}
               onChange={e => setForm({ ...form, beds: e.target.value })}
            />
            <Input
               label="Bathrooms"
               type="number"
               step="0.5"
               placeholder="e.g. 1.5"
               value={form.baths}
               onChange={e => setForm({ ...form, baths: e.target.value })}
            />
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setOpen(false)} type="button">Cancel</Button>
            <Button variant="primary" loading={loading} type="submit">Create Unit</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
