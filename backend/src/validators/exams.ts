import { z } from "zod"

export const examSessionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  durationMin: z.number().int().positive(),
  scheduledAt: z.string(),
  sectionId: z.string().uuid().optional(),
  flightId: z.string().uuid().optional()
})

export const examAttemptSchema = z.object({
  examSessionId: z.string().uuid()
})

export const monitoringLogSchema = z.object({
  examAttemptId: z.string().uuid(),
  event: z.string().min(1)
})
