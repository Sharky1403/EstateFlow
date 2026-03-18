import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LandlordNav } from './LandlordNav'

export const dynamic = 'force-dynamic'

export default async function LandlordLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, company_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'landlord') redirect('/login')

  const initials = (profile?.full_name ?? 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 flex flex-col z-40 bg-dots-dark"
        style={{
          width: '256px',
          background: 'linear-gradient(180deg, #0f1729 0%, #0c1220 100%)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shrink-0">
              E
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm tracking-tight">EstateFlow</p>
              <p className="text-slate-500 text-xs truncate">
                {profile?.company_name ?? 'Property Manager'}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/6" />

        {/* Nav */}
        <LandlordNav />

        {/* Divider */}
        <div className="mx-4 h-px bg-white/6" />

        {/* User + Logout */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/6 transition-all duration-150 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate leading-tight">
                {profile?.full_name}
              </p>
              <p className="text-slate-500 text-xs">Landlord</p>
            </div>
            <a
              href="/api/auth/logout"
              title="Sign out"
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen" style={{ marginLeft: '256px' }}>
        {/* Top bar */}
        <div className="sticky top-0 z-30 h-14 bg-white/80 backdrop-blur border-b border-slate-100 flex items-center px-8">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
            <span className="text-xs text-slate-400 font-medium">Live</span>
          </div>
        </div>
        {/* Content */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
