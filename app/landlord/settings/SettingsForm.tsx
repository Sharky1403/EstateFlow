'use client'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function SectionCard({ icon, title, description, children }: {
  icon: string; title: string; description: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-lg">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

export function SettingsForm({ profile, feeConfig }: { profile: any; feeConfig: any }) {
  const supabase = createClient()
  const router   = useRouter()
  const [profileSaved, setProfileSaved] = useState(false)
  const [feeSaved, setFeeSaved]         = useState(false)

  const profileForm = useForm({
    defaultValues: {
      company_name: profile?.company_name ?? '',
      phone:        profile?.phone ?? '',
    },
  })

  const feeForm = useForm({
    defaultValues: {
      grace_period_days: feeConfig?.grace_period_days ?? 5,
      fee_type:          feeConfig?.fee_type ?? 'percent',
      fee_value:         feeConfig?.fee_value ?? 5,
    },
  })

  async function saveProfile(data: any) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update(data).eq('id', user!.id)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
    router.refresh()
  }

  async function saveFeeConfig(data: any) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('late_fee_config').upsert({ ...data, landlord_id: user!.id })
    setFeeSaved(true)
    setTimeout(() => setFeeSaved(false), 3000)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
      <SectionCard icon="🏢" title="Company Profile" description="Your public business information">
        <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
          <Input
            label="Company Name"
            placeholder="Acme Property Group"
            {...profileForm.register('company_name')}
          />
          <Input
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            type="tel"
            {...profileForm.register('phone')}
          />
          <Button
            type="submit"
            loading={profileForm.formState.isSubmitting}
            className="w-full"
            variant={profileSaved ? 'success' : 'primary'}
          >
            {profileSaved ? '✓ Saved!' : 'Save Profile'}
          </Button>
        </form>
      </SectionCard>

      <SectionCard icon="💳" title="Late Fee Policy" description="Applied automatically after grace period">
        <form onSubmit={feeForm.handleSubmit(saveFeeConfig)} className="space-y-4">
          <Input
            label="Grace Period"
            type="number"
            hint="Number of days before late fee applies"
            {...feeForm.register('grace_period_days', { valueAsNumber: true })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Fee Type</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition"
              {...feeForm.register('fee_type')}
            >
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
          <Input
            label="Fee Value"
            type="number"
            step="0.01"
            hint="Percentage or dollar amount depending on type"
            {...feeForm.register('fee_value', { valueAsNumber: true })}
          />
          <Button
            type="submit"
            loading={feeForm.formState.isSubmitting}
            className="w-full"
            variant={feeSaved ? 'success' : 'primary'}
          >
            {feeSaved ? '✓ Saved!' : 'Save Fee Config'}
          </Button>
        </form>
      </SectionCard>
    </div>
  )
}
