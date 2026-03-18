import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from './LogoutButton'
import Link from 'next/link'

export default async function TenantProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, id_document_url')
    .eq('id', user!.id)
    .single()

  const initials = (profile?.full_name ?? 'T')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-4 page-enter">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your account information.</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        {/* Cover gradient */}
        <div className="h-20" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }} />

        {/* Avatar + name */}
        <div className="px-5 pb-5">
          <div className="-mt-8 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold ring-4 ring-white shadow-md">
              {initials}
            </div>
          </div>

          <h2 className="text-slate-900 font-bold text-base">{profile?.full_name}</h2>
          <p className="text-slate-400 text-sm">{user?.email}</p>

          {/* Info rows */}
          <div className="mt-5 space-y-0 divide-y divide-slate-100">
            <div className="flex items-center justify-between py-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</span>
              <span className="text-sm font-medium text-slate-700">{profile?.phone ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</span>
              <span className="text-sm font-medium text-slate-700">Tenant</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ID Verification</span>
              <div className="flex items-center gap-2">
                {profile?.id_document_url ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Submitted
                  </span>
                ) : (
                  <Link href="/verify" className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                    Upload ID →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
        <LogoutButton />
      </div>
    </div>
  )
}
