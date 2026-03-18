'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'

export function AssignContractorButton({ ticketId, currentContractorId, contractors }: {
  ticketId: string;
  currentContractorId: string | null;
  contractors: any[];
}) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(currentContractorId)
  const [loading, setLoading] = useState(false)

  const currentAssigned = contractors.find(c => c.id === currentContractorId)

  async function handleAssign() {
    setLoading(true)
    await supabase.from('maintenance_tickets').update({ contractor_id: selectedId, status: selectedId ? 'in_progress' : 'open' }).eq('id', ticketId)
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <Card padding="lg">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Contractor Assignment</h3>

      {currentContractorId && currentAssigned ? (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
             {currentAssigned.company_name?.[0] || currentAssigned.full_name?.[0] || 'C'}
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-sm font-medium text-slate-900 truncate">{currentAssigned.company_name || currentAssigned.full_name}</p>
             <p className="text-xs text-slate-500 truncate">{currentAssigned.specialties?.[0] || 'General'}</p>
          </div>
        </div>
      ) : (
        <div className="mb-4 py-6 text-center rounded-xl bg-orange-50 border border-orange-100 border-dashed">
          <p className="text-xs font-medium text-orange-600">Unassigned</p>
        </div>
      )}

      <Button variant="primary" className="w-full" onClick={() => setOpen(true)}>
        {currentContractorId ? 'Reassign' : 'Assign Contractor'}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Select Contractor" size="md">
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          <div
            onClick={() => setSelectedId(null)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${!selectedId ? 'border-primary-600 bg-blue-50/50 ring-1 ring-primary-600' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <p className="text-sm font-medium text-slate-900">None (Unassign)</p>
          </div>
          {contractors.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${selectedId === c.id ? 'border-primary-600 bg-blue-50/50 ring-1 ring-primary-600' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{c.company_name || c.full_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.specialties?.join(', ') || 'General Contractor'}</p>
              </div>
              {selectedId === c.id && <span className="text-primary-600">✓</span>}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAssign} loading={loading}>Save Assignment</Button>
        </div>
      </Modal>
    </Card>
  )
}
