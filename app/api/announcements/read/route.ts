import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { announcementId } = await req.json()
  if (!announcementId) return NextResponse.json({ error: 'Missing announcementId' }, { status: 400 })

  const { error } = await supabase
    .from('notification_read_receipts')
    .upsert({
      announcement_id: announcementId,
      tenant_id: user.id,
      read_at: new Date().toISOString(),
    }, { onConflict: 'announcement_id,tenant_id', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
