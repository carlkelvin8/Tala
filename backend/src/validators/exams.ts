// Import the Zod validation library for schema definition and parsing
import { z } from "zod"

/* Schema for creating a new exam session */
export const examSessionSchema = z.object({
  title: z.string().min(1),                    // Exam title must not be empty
  description: z.string().optional(),          // Optional longer description of the exam
  durationMin: z.number().int().positive(),    // Duration in minutes — must be a positive integer
  scheduledAt: z.string(),                     // ISO date-time string for when the exam is scheduled
  sectionId: z.string().uuid().optional(),     // Optional UUID to restrict the exam to a specific section
  flightId: z.string().uuid().optional()       // Optional UUID to restrict the exam to a specific flight
})

/* Schema for starting an exam attempt */
export const examAttemptSchema = z.object({
  examSessionId: z.string().uuid() // UUID of the exam session the student is attempting
})

/* Schema for logging a monitoring event during an exam attempt */
export const monitoringLogSchema = z.object({
  examAttemptId: z.string().uuid(), // UUID of the exam attempt this event belongs to
  event: z.string().min(1)          // Description of the monitoring event (e.g. "tab switch detected")
})

/* Schema for creating/updating an exam question */
export const examQuestionSchema = z.object({
  type: z.enum(["IDENTIFICATION", "MULTIPLE_CHOICE"]), // Question type the instructor picks
  question: z.string().min(1),                         // Question prompt text
  options: z.array(z.string().min(1)).optional(),      // Answer choices (required for multiple choice)
  correctAnswer: z.string().min(1),                    // Expected answer
  points: z.number().int().positive().default(1),      // Points awarded per question
  order: z.number().int().nonnegative().default(0)     // Display order within the exam
})

export const examQuestionUpdateSchema = examQuestionSchema.partial()
