// Import the Zod validation library for schema definition and parsing
import { z } from "zod"

/* Schema for creating or updating a grade category */
export const gradeCategorySchema = z.object({
  name: z.string().min(1),       // Category name must not be empty (e.g. "Midterm", "Finals")
  weight: z.number().optional()  // Optional percentage weight of this category in the final grade
})

/* Schema for updating a grade category */
export const gradeCategoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  weight: z.number().optional()
})

/* Schema for creating a grade item within a category */
export const gradeItemSchema = z.object({
  title: z.string().min(1),       // Title of the graded activity (e.g. "Quiz 1")
  maxScore: z.number().positive(), // Maximum achievable score — must be a positive number
  categoryId: z.string().uuid()   // UUID of the grade category this item belongs to
})

/* Schema for updating a grade item */
export const gradeItemUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  maxScore: z.number().positive().optional(),
  categoryId: z.string().uuid().optional()
})

/* Schema for encoding a student's score on a grade item */
export const studentGradeSchema = z.object({
  studentId: z.string().uuid(),   // UUID of the student receiving the grade
  gradeItemId: z.string().uuid(), // UUID of the grade item being scored
  score: z.number().nonnegative() // Score must be zero or positive (cannot be negative)
})

/* Schema for updating a student's grade */
export const studentGradeUpdateSchema = z.object({
  score: z.number().nonnegative()
})

export const gradeQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
})
