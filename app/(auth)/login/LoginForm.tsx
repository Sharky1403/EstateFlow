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
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'landlord') window.location.href = '/landlord/dashboard'
      else if (profile?.role === 'tenant') window.location.href = '/tenant/dashboard'
      else if (profile?.role === 'contractor') window.location.href = '/contractor/work-orders'
      else setError('No active role found.')
    }

    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-card">
      <form onSubmit={onSubmit} className="space-y-5">
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
          <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-medium flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            loading={loading}
            className="w-full"
            variant="primary"
            size="lg"
          >
            Sign In to Dashboard
          </Button>
        </div>

        <p className="text-center text-sm text-slate-500 font-medium">
          New here?{' '}
          <Link href="/register" className="text-primary-600 hover:text-primary-700 hover:underline transition-colors">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  )
}
