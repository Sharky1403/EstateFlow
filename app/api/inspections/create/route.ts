import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leaseId, inspectionDate, rooms, overallNotes } = await req.json()

  if (!leaseId || !inspectionDate || !rooms) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify landlord owns this lease's building
  const { data: lease } = await supabase
    .from('leases')
    .select('id, units(buildings(landlord_id))')
    .eq('id', leaseId)
    .single()

  if (!lease || (lease as any).units?.buildings?.landlord_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: inspection, error } = await supabase
    .from('inspections')
    .insert({
      lease_id: leaseId,
      created_by: user.id,
      inspection_date: inspectionDate,
      rooms,
      overall_notes: overallNotes ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ inspection })
}
