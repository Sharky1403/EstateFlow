'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { BuildingSchema } from '@/lib/validations/property'
import { useRouter } from 'next/navigation'

type BuildingData = z.infer<typeof BuildingSchema>

export function NewBuildingButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BuildingData>({
    resolver: zodResolver(BuildingSchema),
  })

  async function onSubmit(data: BuildingData) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('buildings').insert({ ...data, landlord_id: user!.id })
    reset()
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="md">
        <span className="text-base leading-none">+</span>
        Add Building
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add New Building" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Building Name"
            placeholder="e.g. Sunrise Apartments"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="Address"
            placeholder="e.g. 123 Main St, New York, NY"
            {...register('address')}
            error={errors.address?.message}
          />
          <div className="pt-1">
            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
              Create Building
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
