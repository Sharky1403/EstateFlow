import { ForgotPasswordForm } from './ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl border border-white/10 p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">
              🔑
            </div>
            <h1 className="text-2xl font-bold text-white">Forgot password?</h1>
            <p className="text-sm text-slate-400 mt-2">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
