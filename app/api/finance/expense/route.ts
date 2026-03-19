import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, description, category, buildingId, date } = await req.json()

  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  if (!description?.trim()) return NextResponse.json({ error: 'Description required' }, { status: 400 })

  // Verify the landlord owns the building (if provided)
  if (buildingId) {
    const { data: building } = await supabase
      .from('buildings')
      .select('landlord_id')
      .eq('id', buildingId)
      .single()

    if (!building || building.landlord_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error } = await supabase.from('ledger_entries').insert({
    type: 'expense',
    bucket: 'expense',
    amount,
    description: `[${category ?? 'other'}] ${description.trim()}`,
    paid_at: date ? new Date(date).toISOString() : new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
