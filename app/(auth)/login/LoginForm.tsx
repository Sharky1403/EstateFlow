'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginForm() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    if (data.session && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, invited_unit_id')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'landlord') window.location.href = '/landlord/dashboard'
      else if (profile?.role === 'tenant') {
        // If they were invited to a unit, send them to their application page
        window.location.href = profile.invited_unit_id ? '/tenant/application' : '/tenant/dashboard'
      }
      else if (profile?.role === 'contractor') window.location.href = '/contractor/work-orders'
      else setError('No active role found.')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Email Address"
        type="email"
        placeholder="name@company.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200/80 text-sm font-medium flex items-center gap-2 animate-scale-in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <div className="pt-1">
        <Button
          type="submit"
          loading={loading}
          className="w-full"
          variant="gradient"
          size="lg"
        >
          Sign In to Dashboard
        </Button>
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm text-slate-500">
          <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
            Forgot your password?
          </Link>
        </p>
        <p className="text-sm text-slate-500">
          New here?{' '}
          <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </form>
  )
}
