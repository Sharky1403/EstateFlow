import { z } from 'zod'

export const TicketSchema = z.object({
  unit_id: z.string().uuid(),
  description: z.string().min(10),
})

export const WorkOrderSchema = z.object({
  ticket_id: z.string().uuid(),
  contractor_id: z.string().uuid(),
  access_code: z.string().min(4),
})
