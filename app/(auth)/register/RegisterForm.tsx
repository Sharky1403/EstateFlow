'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/database'

const roles: { value: Role; label: string; icon: string; desc: string }[] = [
  { value: 'landlord',   label: 'Landlord',   icon: '🏢', desc: 'Manage properties' },
  { value: 'tenant',     label: 'Tenant',     icon: '🏠', desc: 'View my unit'       },
  { value: 'contractor', label: 'Contractor', icon: '🔧', desc: 'Handle work orders' },
]

export function RegisterForm() {
  const router  = useRouter()
  const supabase = createClient()

  const [role,     setRole]     = useState<Role>('tenant')
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [phone,    setPhone]    = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, full_name: fullName } },
    })

    if (signUpError || !authData.user) {
      setError(signUpError?.message ?? 'Something went wrong')
      setLoading(false)
      return
    }

    await supabase.from('profiles').insert({
      id: authData.user.id,
      role,
      full_name: fullName,
      phone: phone || null,
    })

    setLoading(false)

    if (!authData.session) {
      router.push('/verify')
      return
    }

    if (role === 'landlord')        router.push('/landlord/dashboard')
    else if (role === 'tenant')     router.push('/tenant/dashboard')
    else if (role === 'contractor') router.push('/contractor/work-orders')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">

      {/* Role selector */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">I am a…</p>
        <div className="grid grid-cols-3 gap-2">
          {roles.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all duration-150',
                role === r.value
                  ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-400/20'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <span className="text-xl">{r.icon}</span>
              <span className={cn('text-xs font-semibold', role === r.value ? 'text-primary-700' : 'text-slate-600')}>
                {r.label}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">{r.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Full Name"
        type="text"
        placeholder="Jane Smith"
        value={fullName}
        onChange={e => setFullName(e.target.value)}
        required
        minLength={2}
      />

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
        placeholder="Min. 8 characters"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        minLength={8}
      />

      <Input
        label="Phone"
        type="tel"
        placeholder="+1 (555) 000-0000"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        hint="Optional — used for maintenance alerts"
      />

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200/80 text-sm font-medium flex items-center gap-2 animate-scale-in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <Button
        type="submit"
        loading={loading}
        className="w-full"
        variant="gradient"
        size="lg"
      >
        Create Account
      </Button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  )
}
