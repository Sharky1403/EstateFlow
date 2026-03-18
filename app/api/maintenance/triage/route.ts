import { createAdminClient } from '@/lib/supabase/admin'
import { triageMaintenanceTicket } from '@/lib/openai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { ticket_id, description } = await req.json()
  const supabase = createAdminClient()

  const { urgency, category } = await triageMaintenanceTicket(description)
  await supabase.from('maintenance_tickets').update({ urgency, category }).eq('id', ticket_id)

  return NextResponse.json({ urgency, category })
}
