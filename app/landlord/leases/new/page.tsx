import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { NewLeaseForm } from './NewLeaseForm'

export default async function NewLeasePage({ searchParams }: { searchParams: Promise<{ unitId?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Load all landlord units (vacant preferred) and all tenants
  const { data: units } = await supabase
    .from('units')
    .select('id, unit_number, actual_rent, buildings(id, name, landlord_id)')
    .order('unit_number')

  const myUnits = (units ?? []).filter((u: any) => u.buildings?.landlord_id === user?.id)

  const { data: tenants } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'tenant')

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <Link href="/landlord/leases" className="text-xs text-slate-400 hover:text-slate-600">
          ← Back to Leases
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Create New Lease</h1>
        <p className="text-sm text-slate-500">
          Prorated first-month rent is calculated automatically when move-in is not the 1st.
        </p>
      </div>

      <Card variant="elevated" padding="lg">
        <NewLeaseForm units={myUnits} tenants={tenants ?? []} defaultUnitId={params.unitId} />
      </Card>
    </div>
  )
}
