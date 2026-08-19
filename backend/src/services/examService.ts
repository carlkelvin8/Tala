// Import the Prisma client for database access
import { prisma } from "../lib/prisma.js"
// Import the audit logging helper to record exam events
import { logAudit } from "./auditService.js"

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
  return prisma.examSession.findMany({ where, orderBy: { scheduledAt: "desc" } })
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
