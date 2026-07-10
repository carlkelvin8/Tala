import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

export const REQUIRED_TRAINING_DAYS: Record<string, number> = {
  ROTC: 15,
  CWTS: 0
}

export async function getTrainingDaySummary(termId: string, sectionId?: string) {
  const where: Record<string, unknown> = { termId }
  if (sectionId) where.sectionId = sectionId

  const totalSessions = await prisma.attendanceSession.count({ where })

  const term = await prisma.academicTerm.findUnique({ where: { id: termId } })
  const nstpType = term?.name.toUpperCase().includes("ROTC") ? "ROTC" : "CWTS"
  const required = REQUIRED_TRAINING_DAYS[nstpType] || 0

  return {
    termId,
    termName: term?.name,
    nstpType,
    totalSessions,
    requiredDays: required,
    isCompliant: required === 0 || totalSessions >= required
  }
}

export async function getStudentTrainingDays(userId: string, termId: string) {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      userId,
      session: { termId },
      status: { in: ["PRESENT", "LATE"] }
    },
    include: { session: { select: { id: true, title: true, date: true } } },
    orderBy: { date: "asc" }
  })

  const totalAttended = records.length

  const term = await prisma.academicTerm.findUnique({ where: { id: termId } })
  const nstpType = term?.name.toUpperCase().includes("ROTC") ? "ROTC" : "CWTS"
  const required = REQUIRED_TRAINING_DAYS[nstpType] || 0

  return {
    userId,
    termId,
    termName: term?.name,
    nstpType,
    totalAttended,
    requiredDays: required,
    isCompliant: required === 0 || totalAttended >= required,
    sessions: records.map(r => ({
      id: r.session?.id,
      title: r.session?.title,
      date: r.session?.date,
      status: r.status,
      checkInAt: r.checkInAt
    }))
  }
}

export async function getTermAttendanceOverview(termId: string) {
  const sessions = await prisma.attendanceSession.findMany({
    where: { termId },
    include: {
      records: {
        select: { userId: true, status: true }
      },
      section: { select: { id: true, code: true, name: true } }
    },
    orderBy: { date: "asc" }
  })

  return sessions.map(s => ({
    id: s.id,
    title: s.title,
    date: s.date,
    section: s.section,
    totalPresent: s.records.filter(r => r.status === "PRESENT").length,
    totalLate: s.records.filter(r => r.status === "LATE").length,
    totalAbsent: s.records.filter(r => r.status === "ABSENT").length,
    totalRecords: s.records.length,
    remarks: s.remarks
  }))
}
