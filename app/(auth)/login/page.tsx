import { LoginForm } from './LoginForm'

const stats = [
  { n: '99%',  label: 'Uptime SLA' },
  { n: '10×',  label: 'Faster mgmt' },
  { n: '∞',    label: 'Properties' },
]

const features = [
  'Track units, leases & rent',
  'Real-time maintenance tickets',
  'Automated financial reports',
  'Tenant & contractor portals',
]

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #060b18 0%, #0f1f4a 50%, #0d1a3d 100%)' }}
    >
      {/* ── Animated ambient blobs ─────────────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite 2s',
          }}
        />
        <div
          className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
            animation: 'float 12s ease-in-out infinite 4s',
          }}
        />
      </div>

      {/* ── Left branding panel ─────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            E
          </div>
          <span className="text-white font-bold text-xl tracking-tight">EstateFlow</span>
        </div>

        {/* Headline */}
        <div className="animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-3 py-1.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
            <span className="text-blue-200 text-xs font-semibold">Property management, reimagined</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your properties<br />
            <span className="bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">
              smarter, not harder.
            </span>
          </h1>
          <p className="text-blue-200/80 text-base leading-relaxed max-w-sm">
            Track units, leases, maintenance tickets, and financials — all in one beautifully simple platform.
          </p>

          {/* Feature list */}
          <ul className="mt-8 space-y-2.5">
            {features.map(f => (
              <li key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span className="text-blue-200/80 text-sm">{f}</span>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {stats.map(s => (
              <div
                key={s.label}
                className="bg-white/8 backdrop-blur rounded-2xl p-4 border border-white/10"
              >
                <p className="text-2xl font-bold text-white tabular-lining">{s.n}</p>
                <p className="text-blue-300/70 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-400/60 text-xs">© {new Date().getFullYear()} EstateFlow. All rights reserved.</p>
      </div>

      {/* ── Right form panel ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 relative z-10">
        <div
          className="w-full max-w-sm animate-scale-in"
          style={{ animationDelay: '50ms', animationFillMode: 'both' }}
        >
          {/* Card container */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.4)] p-8 border border-white/20">
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-7 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">E</div>
              <span className="font-bold text-slate-900 text-lg">EstateFlow</span>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to your account to continue</p>
            </div>

            <LoginForm />
          </div>

          <p className="text-center text-xs text-white/30 mt-6">
            Need access?{' '}
            <a href="/register" className="text-blue-400/70 hover:text-blue-300 transition-colors">
              Contact your administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
