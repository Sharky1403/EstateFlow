import { createClient } from '@/lib/supabase/server'
import { VerifyButton } from './VerifyButton'

export const dynamic = 'force-dynamic'

export default async function VerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get landlord's building IDs
  const { data: buildings } = await supabase
    .from('buildings')
    .select('id')
    .eq('landlord_id', user!.id)

  const buildingIds = (buildings ?? []).map((b: any) => b.id)

  // Get unit IDs for those buildings
  const { data: units } = await supabase
    .from('units')
    .select('id')
    .in('building_id', buildingIds.length ? buildingIds : ['00000000-0000-0000-0000-000000000000'])

  const unitIds = (units ?? []).map((u: any) => u.id)

  // Get tenants invited to those units (pending — no lease yet)
  const { data: invitedTenants } = await supabase
    .from('profiles')
    .select('id, full_name, phone, id_document_url, kyc_status, invited_unit_id')
    .eq('role', 'tenant')
    .in('invited_unit_id', unitIds.length ? unitIds : ['00000000-0000-0000-0000-000000000000'])

  // Get tenants with active leases in those units
  const { data: leasedTenants } = await supabase
    .from('profiles')
    .select('id, full_name, phone, id_document_url, kyc_status')
    .eq('role', 'tenant')
    .in('id', unitIds.length
      ? (await supabase.from('leases').select('tenant_id').eq('status', 'active').in('unit_id', unitIds)).data?.map((l: any) => l.tenant_id) ?? []
      : ['00000000-0000-0000-0000-000000000000']
    )

  // Merge and deduplicate
  const seen = new Set<string>()
  const tenants: any[] = []
  for (const t of [...(invitedTenants ?? []), ...(leasedTenants ?? [])]) {
    if (!seen.has(t.id)) { seen.add(t.id); tenants.push(t) }
  }

  const pending  = tenants.filter((t: any) => t.id_document_url && t.kyc_status !== 'approved' && t.kyc_status !== 'rejected')
  const approved = tenants.filter((t: any) => t.kyc_status === 'approved')
  const rejected = tenants.filter((t: any) => t.kyc_status === 'rejected')
  const missing  = tenants.filter((t: any) => !t.id_document_url)

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Identity Verifications</h1>
        <p className="text-sm text-slate-500 mt-1">Review tenant ID documents and approve or reject their applications.</p>
      </div>

      {tenants.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Pending Review', value: pending.length,  color: 'text-amber-600'  },
            { label: 'Approved',       value: approved.length, color: 'text-emerald-600' },
            { label: 'Rejected',       value: rejected.length, color: 'text-red-500'    },
            { label: 'Not Submitted',  value: missing.length,  color: 'text-slate-500'  },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-card p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {tenants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-3xl flex items-center justify-center mx-auto mb-4">🪪</div>
          <p className="text-sm font-semibold text-slate-600">No tenant applications yet</p>
          <p className="text-xs text-slate-400 mt-1">Invited tenants will appear here once they accept.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Tenant', 'Document', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 px-5 pt-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tenants.map((tenant: any) => (
                <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(tenant.full_name ?? 'T').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{tenant.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    {tenant.id_document_url ? (
                      <a href={tenant.id_document_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        View ID
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Not uploaded</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5">
                    {!tenant.id_document_url ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" /> Awaiting upload
                      </span>
                    ) : tenant.kyc_status === 'approved' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Approved
                      </span>
                    ) : tenant.kyc_status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" /> Needs review
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5">
                    {tenant.id_document_url && tenant.kyc_status !== 'approved' && tenant.kyc_status !== 'rejected' && (
                      <VerifyButton tenantId={tenant.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
