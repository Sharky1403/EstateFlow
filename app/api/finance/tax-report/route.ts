import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: entries } = await supabase
    .from('ledger_entries')
    .select('*, leases(units(buildings(landlord_id, name)))')
    .gte('paid_at', `${year}-01-01`)
    .lte('paid_at', `${year}-12-31`)

  const myEntries = (entries ?? []).filter(
    (e: any) => e.leases?.units?.buildings?.landlord_id === user.id
  )

  const income   = myEntries.filter(e => e.bucket === 'revenue').reduce((s, e) => s + Number(e.amount), 0)
  const expenses = myEntries.filter(e => e.bucket === 'expense').reduce((s, e) => s + Number(e.amount), 0)
  const noi      = income - expenses

  const byBuilding: Record<string, { name: string; income: number; expenses: number }> = {}
  for (const e of myEntries) {
    const name = e.leases?.units?.buildings?.name ?? 'Unknown'
    if (!byBuilding[name]) byBuilding[name] = { name, income: 0, expenses: 0 }
    if (e.bucket === 'revenue') byBuilding[name].income  += Number(e.amount)
    if (e.bucket === 'expense') byBuilding[name].expenses += Number(e.amount)
  }

  return NextResponse.json({
    year,
    summary: { income, expenses, noi },
    byBuilding: Object.values(byBuilding),
    entries: myEntries.map(e => ({
      type:        e.type,
      amount:      Number(e.amount),
      bucket:      e.bucket,
      description: e.description ?? '',
      date:        e.paid_at,
      building:    e.leases?.units?.buildings?.name ?? '',
    })),
  })
}
