'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  // Supabase puts the session from the magic link into the URL hash.
  // The browser client picks it up automatically on mount.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
      } else {
        setError('Invalid or expired reset link. Please request a new one.')
      }
    })
  }, [])

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err

      // If new account (invite), redirect to their dashboard directly
      const isNewAccount = new URLSearchParams(window.location.search).get('new_account')
      if (isNewAccount) {
        router.push('/verify')
      } else {
        await supabase.auth.signOut()
        router.push('/login?reset=1')
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to reset password.')
      setLoading(false)
    }
  }

  if (!ready && !error) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto" />
        <p className="text-slate-400 text-sm mt-3">Verifying reset link…</p>
      </div>
    )
  }

  if (error && !ready) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-red-400">{error}</p>
        <Link href="/forgot-password" className="block text-sm text-blue-400 hover:text-blue-300 font-medium">
          Request a new reset link
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          New Password
        </label>
        <input
          type="password"
          className={inputCls}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
          minLength={8}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Confirm Password
        </label>
        <input
          type="password"
          className={inputCls}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Repeat your new password"
          required
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Set New Password
      </Button>
    </form>
  )
}
