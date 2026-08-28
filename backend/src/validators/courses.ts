import { z } from "zod"

export const courseSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  nstpType: z.enum(["CWTS", "ROTC"]).optional()
})
