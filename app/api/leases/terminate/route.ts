import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leaseId } = await req.json()
  if (!leaseId) return NextResponse.json({ error: 'Missing leaseId' }, { status: 400 })

  // Fetch lease and verify landlord owns it
  const { data: lease } = await supabase
    .from('leases')
    .select('id, unit_id, status, break_fee, break_fee_description, units(buildings(landlord_id))')
    .eq('id', leaseId)
    .single()

  if (!lease) return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
  if ((lease as any).units?.buildings?.landlord_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (lease.status === 'terminated') {
    return NextResponse.json({ error: 'Lease is already terminated' }, { status: 400 })
  }

  // Terminate the lease
  const { error: leaseErr } = await supabase
    .from('leases')
    .update({ status: 'terminated' })
    .eq('id', leaseId)

  if (leaseErr) return NextResponse.json({ error: leaseErr.message }, { status: 500 })

  // Mark unit as vacant
  await supabase.from('units').update({ occupied: false }).eq('id', lease.unit_id)

  // Insert lease break fee ledger entry if applicable
  if (lease.break_fee && Number(lease.break_fee) > 0) {
    await supabase.from('ledger_entries').insert({
      lease_id: leaseId,
      type: 'lease_break_fee',
      amount: Number(lease.break_fee),
      bucket: 'revenue',
      description: lease.break_fee_description ?? 'Early termination fee',
    })
  }

  return NextResponse.json({ ok: true })
}
