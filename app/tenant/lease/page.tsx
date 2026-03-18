import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default async function LeasePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: lease } = await supabase.from('leases').select('*').eq('tenant_id', user!.id).single()

  if (!lease)
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">My Lease</h1>
        <Card>
          <p className="text-gray-500">No lease found.</p>
        </Card>
      </div>
    )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Lease</h1>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Lease Details</h2>
          <Badge label={lease.status} variant={lease.status === 'active' ? 'green' : 'gray'} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Start Date</p>
            <p className="font-medium">{new Date(lease.start_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-500">End Date</p>
            <p className="font-medium">{new Date(lease.end_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Monthly Rent</p>
            <p className="font-medium">${lease.monthly_rent}</p>
          </div>
          <div>
            <p className="text-gray-500">Signed</p>
            <p className="font-medium">{lease.signed_at ? new Date(lease.signed_at).toLocaleDateString() : 'Pending'}</p>
          </div>
        </div>
      </Card>
      {lease.clauses?.length > 0 && (
        <Card>
          <h2 className="font-semibold mb-3">Lease Clauses</h2>
          <div className="space-y-3">
            {lease.clauses.map((c: { title: string; body: string }, i: number) => (
              <div key={i} className="border-l-4 border-primary pl-3">
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-sm text-gray-500">{c.body}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
      {lease.pdf_url && (
        <a
          href={lease.pdf_url}
          target="_blank"
          rel="noreferrer"
          className="block w-full text-center bg-primary text-white rounded-lg py-2 text-sm font-medium"
        >
          📄 Download PDF Lease
        </a>
      )}
    </div>
  )
}

