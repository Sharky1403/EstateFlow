'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function EditBuildingButton({ building }: { building: { id: string; name: string; address: string } }) {
  const [open, setOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [name, setName] = useState(building.name)
  const [address, setAddress] = useState(building.address)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.from('buildings').update({ name, address }).eq('id', building.id)
    setLoading(false)
    if (error) { setError(error.message); return }
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    setLoading(true)
    await supabase.from('buildings').delete().eq('id', building.id)
    router.push('/landlord/properties')
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="md" onClick={() => setOpen(true)}>Edit</Button>
        <Button variant="outline" size="md" onClick={() => setDeleteConfirm(true)}
          className="text-red-600 border-red-200 hover:bg-red-50">Delete</Button>
      </div>

      {/* Edit Modal */}
      <Modal open={open} onClose={() => { setOpen(false); setError(null) }} title="Edit Building" size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Building Name" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Address" value={address} onChange={e => setAddress(e.target.value)} required />
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Delete Building" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <strong>{building.name}</strong>? This will also delete all units inside it. This cannot be undone.
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
