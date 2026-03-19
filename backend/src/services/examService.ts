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

/* Return all exam sessions ordered by scheduled date descending */
export async function listExamSessions() {
  // Fetch all exam sessions, most recently scheduled first
  return prisma.examSession.findMany({ orderBy: { scheduledAt: "desc" } })
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

/* End an existing exam attempt by setting its end time */
export async function endExamAttempt(id: string, studentId: string) {
  // Update the exam attempt record with the current time as the end time
  const attempt = await prisma.examAttempt.update({
    where: { id }, // Target the specific attempt by ID
    data: { endedAt: new Date() } // Record when the attempt ended
  })
  // Log the attempt end event to the audit trail
  await logAudit("UPDATE", "ExamAttempt", id, studentId)
  // Return the updated exam attempt object
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
