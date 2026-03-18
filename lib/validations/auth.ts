import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  role: z.enum(['landlord', 'tenant', 'contractor']),
  phone: z.string().optional(),
})

export const InviteTenantSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  unit_id: z.string().uuid(),
  phone: z.string().optional(),
})
