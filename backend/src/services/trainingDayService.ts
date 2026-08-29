import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

export const REQUIRED_TRAINING_DAYS: Record<string, number> = {
  ROTC: 15,
  CWTS: 0
}

/* Resolve which program a training-day aggregate refers to.
   Order: explicit ?program= param, then the section's course program when a
   section is targeted, then (best-effort) the term name. Never silently
   defaults an unknown term to CWTS. */
async function resolveProgram(term: { name: string } | null, sectionId?: string, program?: string | null): Promise<string | null> {
  if (program === "ROTC" || program === "CWTS") return program
  if (sectionId) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { course: { select: { nstpType: true } } }
    })
    if (section?.course?.nstpType) return section.course.nstpType
  }
  const name = term?.name?.toUpperCase() ?? ""
  if (name.includes("ROTC")) return "ROTC"
  if (name.includes("CWTS")) return "CWTS"
  return null
}

export async function getTrainingDaySummary(termId: string, sectionId?: string, program?: string | null) {
  const where: Record<string, unknown> = { termId }
  if (sectionId) where.sectionId = sectionId

  const term = await prisma.academicTerm.findUnique({ where: { id: termId } })

  // Only count sessions from the resolved program when one is known (flight
  // sessions have no section/course, so they always count toward the term).
  const nstpType = await resolveProgram(term, sectionId, program)
  if (nstpType) {
    where.section = { course: { nstpType } }
  }

  const totalSessions = await prisma.attendanceSession.count({ where })

  const required = nstpType ? (REQUIRED_TRAINING_DAYS[nstpType] || 0) : 0

  return {
    termId,
    termName: term?.name ?? null,
    nstpType,
    totalSessions,
    requiredDays: required,
    isCompliant: required === 0 || totalSessions >= required
  }
}

export async function getStudentTrainingDays(userId: string, termId: string, program?: string | null) {
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
  const nstpType = await resolveProgram(term, undefined, program)
  const required = nstpType ? (REQUIRED_TRAINING_DAYS[nstpType] || 0) : 0

  return {
    userId,
    termId,
    termName: term?.name ?? null,
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

export async function getTermAttendanceOverview(termId: string, program?: string | null) {
  const where: Record<string, unknown> = { termId }
  if (program === "ROTC" || program === "CWTS") {
    where.section = { course: { nstpType: program } }
  }
  const sessions = await prisma.attendanceSession.findMany({
    where,
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
