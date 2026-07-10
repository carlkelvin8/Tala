// Import the Zod validation library for schema definition and parsing
import { z } from "zod"

/* Schema for assigning a merit or demerit to a student */
export const meritSchema = z.object({
  studentId: z.string().uuid(),          // UUID of the student receiving the merit/demerit
  type: z.enum(["MERIT", "DEMERIT"]),    // Whether this is a positive merit or a negative demerit
  points: z.number().int(),              // Integer point value (positive for merits, negative for demerits)
  reason: z.string().min(1)             // Mandatory justification text — must not be empty
})

export const meritQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  type: z.enum(["MERIT", "DEMERIT"]).optional(),
  sectionId: z.string().uuid().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
})
