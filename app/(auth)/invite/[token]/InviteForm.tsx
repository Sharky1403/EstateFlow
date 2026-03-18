'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const schema = z.object({
  full_name:        z.string().min(2, 'Full name is required'),
  password:         z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  phone:            z.string().optional(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

export function InviteForm({ email, token }: { email: string; token: string }) {
  const router   = useRouter()
  const supabase = createClient()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setError('')

    const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: token, type: 'invite' })
    if (verifyError) { setError(verifyError.message); return }

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
      data: { full_name: data.full_name },
    })
    if (updateError) { setError(updateError.message); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Session error, please try again'); return }

    await supabase.from('profiles').upsert({
      id: user.id,
      role: 'tenant',
      full_name: data.full_name,
      phone: data.phone ?? null,
    })

    router.push('/verify')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Full Name"         {...register('full_name')}        error={errors.full_name?.message} />
      <Input label="Phone (optional)"  {...register('phone')} type="tel" />
      <Input label="Create Password"   {...register('password')} type="password" error={errors.password?.message} />
      <Input label="Confirm Password"  {...register('confirm_password')} type="password" error={errors.confirm_password?.message} />

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200/80 text-sm font-medium flex items-center gap-2 animate-scale-in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <Button type="submit" loading={isSubmitting} className="w-full" variant="gradient" size="lg">
        Complete Setup
      </Button>
    </form>
  )
}
