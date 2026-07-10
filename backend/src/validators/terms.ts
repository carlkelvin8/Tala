import { z } from "zod"

export const termSchema = z.object({
  name: z.string().min(1, "Term name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.boolean().optional()
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"]
})

export const remarkSchema = z.object({
  userId: z.string().uuid("Valid student ID is required"),
  remark: z.string().min(1, "Remark is required")
})
