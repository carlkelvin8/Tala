import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

export async function createExamSession(data: {
  title: string
  description?: string
  durationMin: number
  scheduledAt: Date
  sectionId?: string
  flightId?: string
}) {
  const session = await prisma.examSession.create({ data })
  await logAudit("CREATE", "ExamSession", session.id)
  return session
}

export async function listExamSessions() {
  return prisma.examSession.findMany({ orderBy: { scheduledAt: "desc" } })
}

export async function startExamAttempt(examSessionId: string, studentId: string) {
  const attempt = await prisma.examAttempt.create({
    data: { examSessionId, studentId, startedAt: new Date() }
  })
  await logAudit("CREATE", "ExamAttempt", attempt.id, studentId)
  return attempt
}

export async function endExamAttempt(id: string, studentId: string) {
  const attempt = await prisma.examAttempt.update({
    where: { id },
    data: { endedAt: new Date() }
  })
  await logAudit("UPDATE", "ExamAttempt", id, studentId)
  return attempt
}

export async function logMonitoringEvent(examAttemptId: string, event: string) {
  const log = await prisma.monitoringLog.create({ data: { examAttemptId, event } })
  await logAudit("CREATE", "MonitoringLog", log.id)
  return log
}
