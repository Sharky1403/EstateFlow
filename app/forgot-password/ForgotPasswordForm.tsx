'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const inputCls = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (err) throw err
      setSent(true)
    } catch (err: any) {
      setError(err.message ?? 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-3xl">
          📧
        </div>
        <h2 className="text-lg font-bold text-white">Check your email</h2>
        <p className="text-sm text-slate-400">
          We sent a password reset link to <strong className="text-white">{email}</strong>.
          Check your inbox and follow the link to reset your password.
        </p>
        <Link href="/login" className="block text-sm text-blue-400 hover:text-blue-300 font-medium mt-4">
          ← Back to login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Email Address
        </label>
        <input
          type="email"
          className={inputCls}
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          autoFocus
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Send Reset Link
      </Button>

      <p className="text-center text-sm text-slate-500">
        Remembered your password?{' '}
        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}
