import { z } from "zod"

export const sectionSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2)
})
