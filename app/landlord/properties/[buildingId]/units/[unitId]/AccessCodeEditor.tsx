'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AccessCodeEditor({ unitId, initialCode }: { unitId: string; initialCode: string | null }) {
  const [code, setCode]       = useState(initialCode ?? '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  async function save() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('units').update({ access_code: code || null }).eq('id', unitId)
    setSaving(false)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <p className="text-gray-400 text-sm mb-1">Access Code</p>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="e.g. Lockbox #4512"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <button
            onClick={save}
            disabled={saving}
            className="text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => { setCode(initialCode ?? ''); setEditing(false) }}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className="font-mono font-medium text-sm text-slate-800">
            {code || <span className="text-slate-400 font-sans">Not set</span>}
          </p>
          {saved && <span className="text-xs text-emerald-600 font-semibold">Saved ✓</span>}
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            {code ? 'Edit' : 'Add'}
          </button>
        </div>
      )}
      <p className="text-xs text-slate-400 mt-1">Shown to contractors on their work orders.</p>
    </div>
  )
}
