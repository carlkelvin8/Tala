// Import the Prisma client for database access
import { prisma } from "../lib/prisma.js"
// Import the audit logging helper to record exam events
import { logAudit } from "./auditService.js"
// Import Prisma types and the question-type enum for type-safe question writes
import { ExamQuestionType } from "@prisma/client"
import type { Prisma } from "@prisma/client"

/* Create a new exam session */
export async function createExamSession(data: {
  title: string         // Human-readable title for the exam
  description?: string  // Optional longer description of the exam
  durationMin: number   // Duration of the exam in minutes
  scheduledAt: Date     // Date and time when the exam is scheduled to start
  sectionId?: string    // Optional UUID to restrict the exam to a specific section
  flightId?: string     // Optional UUID to restrict the exam to a specific flight
}) {
  // Insert a new exam session record with the provided configuration
  const session = await prisma.examSession.create({ data })
  // Log the exam session creation event to the audit trail
  await logAudit("CREATE", "ExamSession", session.id)
  // Return the created exam session object
  return session
}

export async function listExamSessions(filters?: { sectionId?: string }) {
  const where: Record<string, unknown> = {}
  if (filters?.sectionId) where.sectionId = filters.sectionId
  return prisma.examSession.findMany({
    where,
    orderBy: { scheduledAt: "desc" },
    include: { _count: { select: { questions: true } } }
  })
}

export type CreateExamQuestionInput = {
  type: ExamQuestionType        // Question type (identification or multiple choice)
  question: string              // Question prompt text
  options?: string[]            // Answer choices (required for multiple choice)
  correctAnswer: string         // Expected answer
  points?: number               // Points awarded per question
  order?: number                // Display order within the exam
}

export type UpdateExamQuestionInput = Partial<CreateExamQuestionInput>

export async function createExamQuestion(examSessionId: string, data: CreateExamQuestionInput) {
  const session = await prisma.examSession.findUnique({ where: { id: examSessionId } })
  if (!session) throw new Error("Exam session not found")
  if (data.type === ExamQuestionType.MULTIPLE_CHOICE && (data.options?.length ?? 0) < 2) {
    throw new Error("Multiple choice questions require at least 2 options")
  }
  const question = await prisma.examQuestion.create({
    data: {
      examSessionId,
      type: data.type,
      question: data.question,
      options: data.type === ExamQuestionType.MULTIPLE_CHOICE ? (data.options ?? []) : undefined,
      correctAnswer: data.correctAnswer,
      points: data.points ?? 1,
      order: data.order ?? 0
    }
  })
  await logAudit("CREATE", "ExamQuestion", question.id)
  return question
}

export async function listExamQuestions(examSessionId: string) {
  const session = await prisma.examSession.findUnique({ where: { id: examSessionId } })
  if (!session) throw new Error("Exam session not found")
  return prisma.examQuestion.findMany({
    where: { examSessionId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }]
  })
}

export async function updateExamQuestion(questionId: string, data: UpdateExamQuestionInput) {
  const existing = await prisma.examQuestion.findUnique({ where: { id: questionId } })
  if (!existing) throw new Error("Exam question not found")
  const type = data.type ?? existing.type
  const existingOptions = Array.isArray(existing.options) ? (existing.options as string[]) : []
  if (type === ExamQuestionType.MULTIPLE_CHOICE && (data.options?.length ?? existingOptions.length) < 2) {
    throw new Error("Multiple choice questions require at least 2 options")
  }
  const updateData: Prisma.ExamQuestionUpdateInput = {
    type,
    question: data.question,
    correctAnswer: data.correctAnswer,
    points: data.points,
    order: data.order
  }
  if (data.options !== undefined) updateData.options = data.options
  else if (Array.isArray(existing.options)) updateData.options = existing.options as string[]
  const question = await prisma.examQuestion.update({ where: { id: questionId }, data: updateData })
  await logAudit("UPDATE", "ExamQuestion", question.id)
  return question
}

export async function deleteExamQuestion(questionId: string) {
  const existing = await prisma.examQuestion.findUnique({ where: { id: questionId } })
  if (!existing) throw new Error("Exam question not found")
  await prisma.examQuestion.delete({ where: { id: questionId } })
  await logAudit("DELETE", "ExamQuestion", questionId)
  return { id: questionId }
}

/* Start a new exam attempt for a student */
export async function startExamAttempt(examSessionId: string, studentId: string) {
  // Create an exam attempt record with the current time as the start time
  const attempt = await prisma.examAttempt.create({
    data: { examSessionId, studentId, startedAt: new Date() } // Record when the attempt began
  })
  // Log the attempt start event to the audit trail
  await logAudit("CREATE", "ExamAttempt", attempt.id, studentId)
  // Return the created exam attempt object
  return attempt
}

/* End an existing exam attempt by setting its end time, with ownership verification */
export async function endExamAttempt(id: string, studentId: string) {
  // Verify the attempt belongs to the requesting student
  const existing = await prisma.examAttempt.findUnique({ where: { id } })
  if (!existing) {
    throw new Error("Exam attempt not found")
  }
  if (existing.studentId !== studentId) {
    throw new Error("Unauthorized: this attempt belongs to another student")
  }
  if (existing.endedAt) {
    throw new Error("Exam attempt already submitted")
  }

  const attempt = await prisma.examAttempt.update({
    where: { id },
    data: { endedAt: new Date() }
  })
  await logAudit("UPDATE", "ExamAttempt", id, studentId)
  return attempt
}

/* Log a monitoring event that occurred during an exam attempt */
export async function logMonitoringEvent(examAttemptId: string, event: string) {
  // Create a monitoring log record linking the event to the exam attempt
  const log = await prisma.monitoringLog.create({ data: { examAttemptId, event } })
  // Log the monitoring event creation to the audit trail
  await logAudit("CREATE", "MonitoringLog", log.id)
  // Return the created monitoring log object
  return log
}

/* List exam attempts for a student (or all for admin) */
export async function listExamAttempts(studentId: string) {
  return prisma.examAttempt.findMany({
    where: { studentId },
    include: { examSession: { select: { title: true, durationMin: true, scheduledAt: true } } },
    orderBy: { createdAt: "desc" }
  })
}
