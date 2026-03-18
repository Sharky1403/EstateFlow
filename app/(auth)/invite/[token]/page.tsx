import { InviteForm } from './InviteForm'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ token: string }>
  searchParams: Promise<{ email?: string }>
}

export default async function InvitePage({ params, searchParams }: Props) {
  const resolvedParams      = await params
  const resolvedSearchParams = await searchParams
  const email = resolvedSearchParams.email ?? ''

  if (!email) redirect('/login')

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #060b18 0%, #0f1f4a 50%, #0d1a3d 100%)' }}
    >
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', animation: 'float 8s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', animation: 'float 10s ease-in-out infinite 3s' }}
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.4)] p-8 border border-white/20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="EstateFlow" className="h-9 w-auto" />
          </div>

          {/* Invite badge */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 rounded-xl px-4 py-3 mb-6">
            <span className="text-emerald-500 text-lg shrink-0">🎉</span>
            <div>
              <p className="text-emerald-800 text-sm font-semibold">You've been invited!</p>
              <p className="text-emerald-600 text-xs">Set a password to activate your account.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Activate Account</h2>
          <p className="text-slate-500 text-sm mb-6">
            Signing in as <span className="font-semibold text-slate-700">{email}</span>
          </p>

          <InviteForm email={email} token={resolvedParams.token} />
        </div>
      </div>
    </div>
  )
}
