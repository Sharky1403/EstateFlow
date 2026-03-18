'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  phone: z.string().optional(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

interface Props {
  email: string
  token: string
}

export function InviteForm({ email, token }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError('')

    // Exchange the invite token and set the new password
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'invite',
    })

    if (verifyError) { setError(verifyError.message); return }

    // Update password and profile
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
    <Card>
      <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
        ✉️ Setting up account for <strong>{email}</strong>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          {...register('full_name')}
          error={errors.full_name?.message}
        />
        <Input
          label="Phone (optional)"
          type="tel"
          {...register('phone')}
        />
        <Input
          label="Create Password"
          type="password"
          {...register('password')}
          error={errors.password?.message}
        />
        <Input
          label="Confirm Password"
          type="password"
          {...register('confirm_password')}
          error={errors.confirm_password?.message}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" loading={isSubmitting} className="w-full">
          Complete Setup
        </Button>
      </form>
    </Card>
  )
}
