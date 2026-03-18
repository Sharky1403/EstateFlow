import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TenantBottomNav } from './TenantBottomNav'

export const dynamic = 'force-dynamic'

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'tenant') redirect('/login')

  const initials = (profile?.full_name ?? 'T')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      {/* ── Header ───────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 h-14 flex items-center animate-slide-down"
        style={{
          background: 'linear-gradient(180deg, #080d1c 0%, #0b1122 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-2xl mx-auto px-5 w-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                E
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-sidebar shadow-[0_0_5px_rgba(74,222,128,0.7)]" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">EstateFlow</span>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm ring-2 ring-white/10">
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-24">
        {children}
      </main>

      <TenantBottomNav />
    </div>
  )
}
