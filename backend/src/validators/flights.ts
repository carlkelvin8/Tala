import { z } from "zod"

export const flightSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2)
})
