import { z } from 'zod'

export const ClauseSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
})

export const LeaseSchema = z.object({
  unit_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string(),
  monthly_rent: z.number().positive(),
  clauses: z.array(ClauseSchema).default([]),
})
