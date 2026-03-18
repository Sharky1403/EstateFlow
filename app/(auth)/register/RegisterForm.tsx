'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Role } from '@/types/database'

export function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()

  const [role, setRole] = useState<Role>('tenant')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const roles: { value: Role; label: string }[] = [
    { value: 'landlord', label: '🏠 Landlord' },
    { value: 'tenant', label: '👤 Tenant' },
    { value: 'contractor', label: '🔧 Contractor' },
  ]

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName },
      },
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

    // If email confirmation is required, session will be null — send to verify page
    if (!authData.session) {
      router.push('/verify')
      return
    }

    // Already signed in — go directly to the right dashboard
    if (role === 'landlord') router.push('/landlord/dashboard')
    else if (role === 'tenant') router.push('/tenant/dashboard')
    else if (role === 'contractor') router.push('/contractor/work-orders')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <form onSubmit={onSubmit} className="space-y-4">

        {/* Role Selector */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">I am a...</p>
          <div className="grid grid-cols-3 gap-2">
            {roles.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`rounded-lg border p-3 text-sm font-medium transition-colors
                  ${role === r.value
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Full Name */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            required
            minLength={2}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            required
            minLength={8}
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Phone <span className="text-gray-400">(optional)</span></label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>

      </form>
    </div>
  )
}
