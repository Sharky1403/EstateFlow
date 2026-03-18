import { z } from 'zod'

export const ExpenseSchema = z.object({
  lease_id: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().min(1),
})

export const LateFeeConfigSchema = z.object({
  grace_period_days: z.number().int().min(1).max(30),
  fee_type: z.enum(['percent', 'fixed']),
  fee_value: z.number().positive(),
})
