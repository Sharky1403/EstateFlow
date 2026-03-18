import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export default async function TenantMaintenancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: tickets } = await supabase
    .from('maintenance_tickets')
    .select('*')
    .eq('tenant_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Tickets</h1>
        <Link href="/tenant/maintenance/new">
          <Button>+ New Request</Button>
        </Link>
      </div>
      {tickets?.map(t => (
        <Link key={t.id} href={`/tenant/maintenance/${t.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm">{t.description.slice(0, 100)}</p>
              <div className="flex flex-col gap-1 shrink-0">
                {t.urgency && <Badge label={t.urgency} variant={t.urgency === 'emergency' ? 'red' : 'yellow'} />}
                <Badge label={t.status} variant={t.status === 'complete' ? 'green' : 'blue'} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{new Date(t.created_at).toLocaleDateString()}</p>
          </Card>
        </Link>
      ))}
    </div>
  )
}

