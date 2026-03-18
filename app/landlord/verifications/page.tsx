import { createClient } from '@/lib/supabase/server'
import { VerifyButton } from './VerifyButton'

export default async function VerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get all tenants in this landlord's buildings via active leases
  const { data: leases } = await supabase
    .from('leases')
    .select(`
      tenant_id,
      units(buildings(landlord_id)),
      profiles!tenant_id(id, full_name, email, id_document_url, kyc_status)
    `)
    .eq('status', 'active')

  const myLeases = (leases ?? []).filter(
    (l: any) => l.units?.buildings?.landlord_id === user?.id
  )

  // Deduplicate by tenant_id
  const seen = new Set<string>()
  const tenants = myLeases
    .filter((l: any) => { if (seen.has(l.tenant_id)) return false; seen.add(l.tenant_id); return true })
    .map((l: any) => l.profiles)
    .filter(Boolean)

  const pending  = tenants.filter((t: any) => t.id_document_url && t.kyc_status !== 'approved')
  const approved = tenants.filter((t: any) => t.kyc_status === 'approved')
  const missing  = tenants.filter((t: any) => !t.id_document_url)

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Identity Verifications</h1>
        <p className="text-sm text-slate-500 mt-1">Review tenant ID documents submitted through the portal.</p>
      </div>

      {/* Stats */}
      {tenants.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending Review', value: pending.length,  color: 'text-amber-600'  },
            { label: 'Approved',       value: approved.length, color: 'text-emerald-600' },
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
          <p className="text-sm font-semibold text-slate-600">No active tenants</p>
          <p className="text-xs text-slate-400 mt-1">Tenants with active leases will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Tenant', 'Email', 'Document', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 px-5 pt-4">
                    {h}
                  </th>
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
                  <td className="py-3.5 px-5 text-slate-500 text-xs">{tenant.email ?? '—'}</td>
                  <td className="py-3.5 px-5">
                    {tenant.id_document_url ? (
                      <a
                        href={tenant.id_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1"
                      >
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
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
                        Pending upload
                      </span>
                    ) : tenant.kyc_status === 'approved' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Approved
                      </span>
                    ) : tenant.kyc_status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                        Needs review
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5">
                    {tenant.id_document_url && tenant.kyc_status !== 'approved' && (
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
