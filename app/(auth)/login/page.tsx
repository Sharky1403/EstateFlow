import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1a56db 100%)' }}>
      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-lg">
            E
          </div>
          <span className="text-white font-bold text-xl tracking-tight">EstateFlow</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-snug mb-4">
            Manage your properties<br />
            <span className="text-blue-300">smarter, not harder.</span>
          </h1>
          <p className="text-blue-200 text-base leading-relaxed max-w-sm">
            Track units, leases, maintenance tickets, and financials — all in one place.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { n: '99%', label: 'Uptime SLA' },
              { n: '10×', label: 'Faster mgmt' },
              { n: '∞',  label: 'Properties' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-2xl p-4">
                <p className="text-2xl font-bold text-white">{s.n}</p>
                <p className="text-blue-200 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-sm">© {new Date().getFullYear()} EstateFlow. All rights reserved.</p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white lg:rounded-l-3xl">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold">E</div>
            <span className="font-bold text-slate-900 text-lg">EstateFlow</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-8">Sign in to your account to continue</p>

          <LoginForm />

          <p className="text-center text-xs text-slate-400 mt-8">
            Need an account?{' '}
            <a href="/register" className="text-primary-600 hover:underline font-medium">
              Contact your administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
