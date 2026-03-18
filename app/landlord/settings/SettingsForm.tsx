'use client'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import Image from 'next/image'

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
  const supabase  = createClient()
  const router    = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [profileSaved, setProfileSaved]   = useState(false)
  const [feeSaved, setFeeSaved]           = useState(false)
  const [logoUrl,  setLogoUrl]            = useState<string>(profile?.logo_url ?? '')
  const [logoUploading, setLogoUploading] = useState(false)

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

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const path = `logos/${user!.id}/${Date.now()}_${file.name}`
    const { data: upload, error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error && upload) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(upload.path)
      const url = urlData.publicUrl
      await supabase.from('profiles').update({ logo_url: url }).eq('id', user!.id)
      setLogoUrl(url)
    }
    setLogoUploading(false)
    router.refresh()
  }

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

      {/* Logo upload */}
      <SectionCard icon="🖼️" title="Company Logo" description="Shown on lease PDFs and tenant portal">
        <div className="flex flex-col items-center gap-4">
          <div
            onClick={() => fileInput.current?.click()}
            className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary-300 cursor-pointer overflow-hidden flex items-center justify-center bg-slate-50 hover:bg-primary-50 transition-all group"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center px-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1 group-hover:stroke-primary-400 transition-colors">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p className="text-xs text-slate-400 group-hover:text-primary-600 transition-colors">Upload logo</p>
              </div>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadLogo}
          />
          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={logoUploading}
              onClick={() => fileInput.current?.click()}
            >
              {logoUrl ? 'Change logo' : 'Upload logo'}
            </Button>
            <p className="text-xs text-slate-400 mt-1.5">PNG, JPG or SVG — max 5MB</p>
          </div>
        </div>
      </SectionCard>

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
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Type</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 hover:border-slate-300 transition-all duration-150"
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
