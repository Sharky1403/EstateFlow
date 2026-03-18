'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const schema = z.object({ description: z.string().min(10, 'Please describe the issue in detail') })
type FormData = z.infer<typeof schema>

const DRAFT_KEY = 'maintenance_draft'

export default function NewTicketPage() {
  const router = useRouter()
  const supabase = createClient()
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) setValue('description', draft)
  }, [setValue])

  function saveDraft(val: string) {
    localStorage.setItem(DRAFT_KEY, val)
  }

  async function onSubmit(data: FormData) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: lease } = await supabase.from('leases').select('unit_id').eq('tenant_id', user!.id).single()

    let photo_url = null
    if (photoFile) {
      const { data: upload } = await supabase.storage
        .from('maintenance-photos')
        .upload(`${user!.id}/${Date.now()}_${photoFile.name}`, photoFile)
      if (upload) {
        const { data: urlData } = supabase.storage.from('maintenance-photos').getPublicUrl(upload.path)
        photo_url = urlData.publicUrl
      }
    }

    await supabase.from('maintenance_tickets').insert({
      tenant_id: user!.id,
      unit_id: lease?.unit_id,
      description: data.description,
      photo_url,
      status: 'open',
    })

    localStorage.removeItem(DRAFT_KEY)
    router.push('/tenant/maintenance')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Report an Issue</h1>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Describe the issue *</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm h-32 resize-none focus:border-primary focus:outline-none"
              placeholder="e.g. The kitchen sink is leaking under the cabinet..."
              {...register('description')}
              onChange={e => {
                register('description').onChange(e)
                saveDraft(e.target.value)
              }}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Attach Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="mt-1 w-full text-sm"
              onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit" loading={isSubmitting} className="w-full">
            Submit Request
          </Button>
        </form>
      </Card>
    </div>
  )
}

