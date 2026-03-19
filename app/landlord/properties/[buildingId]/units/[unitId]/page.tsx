import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MediaUploader } from './MediaUploader'
import { AccessCodeEditor } from './AccessCodeEditor'
import { EditUnitButton } from '../../EditUnitButton'

export const dynamic = 'force-dynamic'
import { InviteButton } from '@/app/landlord/leases/InviteButton'
import Link from 'next/link'

export default async function UnitDetailPage({ params }: { params: Promise<{ buildingId: string; unitId: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: unit } = await supabase
    .from('units')
    .select('*, buildings(name, address)')
    .eq('id', resolvedParams.unitId)
    .single()

  const { data: lease } = await supabase
    .from('leases')
    .select('*, profiles(full_name, phone, email:id)')
    .eq('unit_id', resolvedParams.unitId)
    .eq('status', 'active')
    .single()

  const { data: mediaFiles } = await supabase.storage.from('unit-media').list(resolvedParams.unitId)

  const revenueLoss = unit ? (unit.market_rent - unit.actual_rent) * 12 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/landlord/properties/${resolvedParams.buildingId}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← {(unit as any)?.buildings?.name}
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Unit {unit?.unit_number}</h1>
          <Badge label={unit?.occupied ? 'Occupied' : 'Vacant'} variant={unit?.occupied ? 'green' : 'gray'} />
        </div>
        <EditUnitButton
          unit={{ id: resolvedParams.unitId, unit_number: unit?.unit_number ?? '', floor_number: unit?.floor_number ?? 1, market_rent: unit?.market_rent ?? 0, actual_rent: unit?.actual_rent ?? 0 }}
          buildingId={resolvedParams.buildingId}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Market Rent</p>
          <p className="text-2xl font-bold text-gray-900">${unit?.market_rent}/mo</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Actual Rent</p>
          <p className="text-2xl font-bold text-primary">${unit?.actual_rent}/mo</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Annual Revenue Loss</p>
          <p className={`text-2xl font-bold ${revenueLoss > 0 ? 'text-danger' : 'text-success'}`}>
            {revenueLoss > 0 ? `-$${revenueLoss.toLocaleString()}` : '$0'}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold mb-4">Unit Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Floor</p>
            <p className="font-medium">{unit?.floor_number}</p>
          </div>
          <div>
            <p className="text-gray-400">Square Footage</p>
            <p className="font-medium">{unit?.metadata?.sq_ft ?? '—'} sq ft</p>
          </div>
          <div>
            <p className="text-gray-400">Paint Code</p>
            <p className="font-medium font-mono">{unit?.metadata?.paint_code ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">Address</p>
            <p className="font-medium">{(unit as any)?.buildings?.address}</p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100">
          <AccessCodeEditor unitId={resolvedParams.unitId} initialCode={unit?.access_code ?? null} />
        </div>

        {unit?.metadata?.appliance_serials && Object.keys(unit.metadata.appliance_serials).length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Appliance Serial Numbers</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(unit.metadata.appliance_serials).map(([appliance, serial]) => (
                <div key={appliance} className="bg-gray-50 rounded-lg p-2 text-sm">
                  <p className="text-gray-500 capitalize">{appliance}</p>
                  <p className="font-mono font-medium">{serial as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold mb-4">Active Lease</h2>
        {lease ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Tenant</p>
                <p className="font-medium">{(lease.profiles as any)?.full_name}</p>
              </div>
              <div>
                <p className="text-gray-400">Phone</p>
                <p className="font-medium">{(lease.profiles as any)?.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400">Lease Start</p>
                <p className="font-medium">{new Date(lease.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Lease End</p>
                <p className="font-medium">{new Date(lease.end_date).toLocaleDateString()}</p>
              </div>
            </div>
            <Link href={`/landlord/leases/${lease.id}`} className="inline-block text-sm text-primary hover:underline">
              View Full Lease →
            </Link>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <p className="text-gray-400">No active lease.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={`/landlord/leases/new?unitId=${resolvedParams.unitId}`} className="text-sm text-primary hover:underline">
                Create a lease →
              </Link>
              <span className="text-gray-300">·</span>
              <InviteButton
                units={[{ id: resolvedParams.unitId, unit_number: unit?.unit_number ?? '', building_name: (unit as any)?.buildings?.name ?? '' }]}
                preselectedUnitId={resolvedParams.unitId}
              />
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold mb-4">Media Gallery</h2>
        <MediaUploader buildingId={resolvedParams.buildingId} unitId={resolvedParams.unitId} currentPhotos={[]} />
      </Card>
    </div>
  )
}

