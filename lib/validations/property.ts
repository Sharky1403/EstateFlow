import { z } from 'zod'

export const BuildingSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
})

export const UnitSchema = z.object({
  building_id: z.string().uuid(),
  floor_number: z.number().int().min(0),
  unit_number: z.string().min(1),
  market_rent: z.number().positive(),
  actual_rent: z.number().positive(),
  metadata: z.object({
    sq_ft: z.number().optional(),
    paint_code: z.string().optional(),
    appliance_serials: z.record(z.string()).optional(),
  }).optional(),
})
