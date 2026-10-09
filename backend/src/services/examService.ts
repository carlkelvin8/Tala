// Import the Prisma client for database access
import { prisma } from "../lib/prisma.js"
// Import the audit logging helper to record exam events
import { logAudit } from "./auditService.js"
// Import Prisma types and the question-type enum for type-safe question writes
import { ExamQuestionType, NstpType } from "@prisma/client"
import type { Prisma } from "@prisma/client"
// Import the program guard so scoped staff can only create exams in their own program
import { assertSectionProgram } from "./programGuard.js"

/* Create a new exam session */
export async function createExamSession(data: {
  title: string         // Human-readable title for the exam
  description?: string  // Optional longer description of the exam
  fileUrl?: string
  durationMin: number   // Duration of the exam in minutes
  scheduledAt: Date     // Date and time when the exam is scheduled to start
  sectionId?: string    // Optional UUID to restrict the exam to a specific section
  flightId?: string     // Optional UUID to restrict the exam to a specific flight
  scopeProgram?: NstpType | null // Program the caller is locked to (ROTC for implementors)
}) {
  // Scoped staff (implementors) must target a section of their own program;
  // general and flight-only exams are program-agnostic and admin-managed.
  if (data.scopeProgram) {
    if (!data.sectionId) {
      throw new Error("You must scope the exam to a section of your program")
    }
    await assertSectionProgram(data.sectionId, data.scopeProgram)
  }

  const { scopeProgram, ...createData } = data
  // Insert a new exam session record with the provided configuration
  const session = await prisma.examSession.create({ data: createData })
  // Log the exam session creation event to the audit trail
  await logAudit("CREATE", "ExamSession", session.id)
  // Return the created exam session object
  return session
}

export async function listExamSessions(filters?: {
  sectionId?: string
  program?: NstpType
  studentVisibility?: { sectionId?: string; flightId?: string }
}) {
  const where: Record<string, unknown> = {}
  // Students see general exams plus exams tied to their own section/flight.
  if (filters?.studentVisibility) {
    const visibleFor = [
      { sectionId: null, flightId: null },
      ...(filters.studentVisibility.sectionId ? [{ sectionId: filters.studentVisibility.sectionId }] : []),
      ...(filters.studentVisibility.flightId ? [{ flightId: filters.studentVisibility.flightId }] : []),
    ]
    where.OR = visibleFor
  } else if (filters?.sectionId) {
    where.sectionId = filters.sectionId
  } else if (filters?.program) {
    where.OR = [{ section: { course: { nstpType: filters.program } } }]
  }
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

/* Transition an exam session's status (publish / open / close) */
export async function updateExamSessionStatus(examSessionId: string, status: "SCHEDULED" | "ACTIVE" | "CLOSED") {
  const existing = await prisma.examSession.findUnique({ where: { id: examSessionId } })
  if (!existing) throw new Error("Exam session not found")
  const session = await prisma.examSession.update({ where: { id: examSessionId }, data: { status } })
  await logAudit("UPDATE", "ExamSession", session.id)
  return session
}

/* Start a new exam attempt for a student — enforces exam state, membership, and single-attempt */
export async function startExamAttempt(examSessionId: string, studentId: string) {
  const session = await prisma.examSession.findUnique({ where: { id: examSessionId } })
  if (!session) throw new Error("Exam session not found")
  if (session.status !== "ACTIVE" && session.status !== "SCHEDULED") {
    throw new Error(`Exam cannot be started while it is ${session.status.toLowerCase()}`)
  }
  const now = new Date()
  if (session.scheduledAt > now) {
    throw new Error("This exam has not started yet")
  }
  const latestStart = new Date(session.scheduledAt.getTime() + session.durationMin * 60_000)
  if (now > latestStart) {
    throw new Error("This exam window has already ended")
  }
  // Only allow students enrolled in the exam's section/flight to take it
  if (session.sectionId || session.flightId) {
    const membership = await prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        status: "APPROVED",
        OR: [
          ...(session.sectionId ? [{ sectionId: session.sectionId }] : []),
          ...(session.flightId ? [{ flightId: session.flightId }] : []),
        ],
      },
    })
    if (!membership) {
      throw new Error("You are not enrolled in the section or flight assigned to this exam")
    }
  }
  // One attempt per student per exam — never retake
  const prior = await prisma.examAttempt.findFirst({ where: { examSessionId, studentId } })
  if (prior) {
    throw new Error("You have already attempted this exam")
  }
  // Create an exam attempt record with the current time as the start time
  const attempt = await prisma.examAttempt.create({
    data: { examSessionId, studentId, startedAt: now } // Record when the attempt began
  })
  // Log the attempt start event to the audit trail
  await logAudit("CREATE", "ExamAttempt", attempt.id, studentId)
  // Return the created exam attempt object
  return attempt
}

/* End an existing exam attempt by setting its end time, with ownership
   verification. Server-side duration is enforced: a submit arriving past the
   deadline is capped at the deadline and flagged as expired. */
export async function endExamAttempt(id: string, studentId: string, submittedAnswers: Array<{ questionId: string; answer: string }> = []) {
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

  const session = await prisma.examSession.findUnique({
    where: { id: existing.examSessionId },
    select: { durationMin: true },
  })
  // Guard against a null startedAt (partial write) by falling back to createdAt
  const startedAt = existing.startedAt ?? existing.createdAt
  const deadline = session ? new Date(startedAt.getTime() + session.durationMin * 60_000) : null
  const now = new Date()
  const expired = deadline !== null && now > deadline
  const endedAt = expired ? deadline : now

  const questions = await prisma.examQuestion.findMany({ where: { examSessionId: existing.examSessionId } })
  const answerMap = new Map(submittedAnswers.map((answer) => [answer.questionId, answer.answer.trim().toLowerCase()]))
  const totalPoints = questions.reduce((total, question) => total + question.points, 0)
  const earnedPoints = questions.reduce((total, question) => total + (answerMap.get(question.id) === question.correctAnswer.trim().toLowerCase() ? question.points : 0), 0)
  const score = totalPoints ? Math.round((earnedPoints / totalPoints) * 10000) / 100 : 0
  const attempt = await prisma.examAttempt.update({
    where: { id },
    data: { endedAt, answers: submittedAnswers, score }
  })
  await logAudit("UPDATE", "ExamAttempt", id, studentId)
  return { ...attempt, expired }
}

/* Log a monitoring event for a student's own, in-progress exam attempt */
export async function logMonitoringEvent(examAttemptId: string, event: string, studentId?: string) {
  // Verify the attempt exists and (when the caller is a student) belongs to them
  const attempt = await prisma.examAttempt.findUnique({ where: { id: examAttemptId } })
  if (!attempt) {
    throw new Error("Exam attempt not found")
  }
  if (studentId !== undefined && attempt.studentId !== studentId) {
    throw new Error("Unauthorized: this attempt belongs to another student")
  }
  if (attempt.endedAt) {
    throw new Error("Exam attempt already submitted")
  }
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

export async function listAttemptQuestions(attemptId: string, studentId: string) {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } })
  if (!attempt || attempt.studentId !== studentId) throw new Error("Exam attempt not found")
  if (attempt.endedAt) throw new Error("This coursework has already been submitted")
  return prisma.examQuestion.findMany({ where: { examSessionId: attempt.examSessionId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true, type: true, question: true, options: true, points: true, order: true } })
}
