// Import the Zod validation library for schema definition and parsing
import { z } from "zod"

/* Schema for creating or updating a grade category */
export const gradeCategorySchema = z.object({
  name: z.string().min(1),       // Category name must not be empty (e.g. "Midterm", "Finals")
  weight: z.number().optional()  // Optional percentage weight of this category in the final grade
})

/* Schema for creating a grade item within a category */
export const gradeItemSchema = z.object({
  title: z.string().min(1),       // Title of the graded activity (e.g. "Quiz 1")
  maxScore: z.number().positive(), // Maximum achievable score — must be a positive number
  categoryId: z.string().uuid()   // UUID of the grade category this item belongs to
})

/* Schema for encoding a student's score on a grade item */
export const studentGradeSchema = z.object({
  studentId: z.string().uuid(),   // UUID of the student receiving the grade
  gradeItemId: z.string().uuid(), // UUID of the grade item being scored
  score: z.number().nonnegative() // Score must be zero or positive (cannot be negative)
})

/* Schema for query parameters when listing student grades */
export const gradeQuerySchema = z.object({
  studentId: z.string().uuid().optional(), // Filter grades by a specific student's UUID
  page: z.string().optional(),             // Page number for pagination
  pageSize: z.string().optional()          // Items per page for pagination
})
