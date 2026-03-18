import { RegisterForm } from './RegisterForm'

export default function RegisterPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #060b18 0%, #0f1f4a 50%, #0d1a3d 100%)' }}
    >
      {/* Ambient glow blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
            animation: 'float 9s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
            animation: 'float 11s ease-in-out infinite 3s',
          }}
        />
      </div>

      {/* Card */}
      <div
        className="w-full max-w-md relative z-10 animate-scale-in"
        style={{ animationFillMode: 'both' }}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.4)] p-8 border border-white/20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-7">
            <img src="/logo.png" alt="EstateFlow" className="h-9 w-auto" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Create an account</h2>
          <p className="text-slate-500 text-sm mb-7">Get started with EstateFlow today</p>

          <RegisterForm />
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-blue-400/70 hover:text-blue-300 transition-colors">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
