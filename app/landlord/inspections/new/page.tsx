import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { InspectionForm } from './InspectionForm'

export default async function NewInspectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: leases } = await supabase
    .from('leases')
    .select('id, units(unit_number, buildings(name, landlord_id)), profiles!tenant_id(full_name)')
    .eq('status', 'active')

  const myLeases = (leases ?? []).filter((l: any) => l.units?.buildings?.landlord_id === user?.id)

  return (
    <div className="max-w-3xl mx-auto space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Move-In Inspection</h1>
        <p className="text-sm text-slate-500 mt-1">Record the property condition at the start of a lease.</p>
      </div>
      <Card padding="lg" variant="elevated">
        <InspectionForm leases={myLeases as any} />
      </Card>
    </div>
  )
}
