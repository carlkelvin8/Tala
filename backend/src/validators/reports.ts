import { z } from "zod"

export const reportQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  sectionId: z.string().uuid().optional(),
  flightId: z.string().uuid().optional()
})
