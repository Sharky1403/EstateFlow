import { createClient } from '@/lib/supabase/server'
import { TenantChat } from './TenantChat'

export default async function TenantMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Find landlord via active lease
  const { data: lease } = await supabase
    .from('leases')
    .select('units(buildings(landlord_id, name, profiles!buildings_landlord_id_fkey(full_name)))')
    .eq('tenant_id', user!.id)
    .eq('status', 'active')
    .single()

  const building = (lease as any)?.units?.buildings
  const landlordId = building?.landlord_id
  const landlordName = building?.profiles?.full_name ?? building?.name ?? 'Property Manager'

  if (!landlordId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-4">💬</div>
        <h2 className="text-base font-semibold text-slate-700">No active lease</h2>
        <p className="text-sm text-slate-400 mt-1">You need an active lease to message your landlord.</p>
      </div>
    )
  }

  // Find existing conversation
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('tenant_id', user!.id)
    .eq('landlord_id', landlordId)
    .single()

  // Create if doesn't exist
  if (!conversation) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ tenant_id: user!.id, landlord_id: landlordId })
      .select('id')
      .single()
    conversation = newConv
  }

  if (!conversation) {
    return (
      <div className="text-center py-20 text-sm text-slate-500">
        Failed to open conversation. Please refresh.
      </div>
    )
  }

  return (
    <div className="space-y-4 page-enter">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-500 mt-0.5">Direct chat with your property manager</p>
      </div>
      <TenantChat conversationId={conversation.id} landlordName={landlordName} />
    </div>
  )
}
