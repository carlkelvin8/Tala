import { z } from "zod"

export const gradeCategorySchema = z.object({
  name: z.string().min(1),
  weight: z.number().optional()
})

export const gradeItemSchema = z.object({
  title: z.string().min(1),
  maxScore: z.number().positive(),
  categoryId: z.string().uuid()
})

export const studentGradeSchema = z.object({
  studentId: z.string().uuid(),
  gradeItemId: z.string().uuid(),
  score: z.number().nonnegative()
})

export const gradeQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
})
