import { AttendanceStatus, NstpType } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"
import { checkAndMarkAbsences } from "./absenceService.js"
import { userProgram } from "./programGuard.js"
import { utcStartOfDay } from "../lib/dates.js"
import { env } from "../lib/env.js"
import { createHmac, timingSafeEqual } from "crypto"

const TOKEN_VALIDITY_MS = 6 * 24 * 60 * 60 * 1000 // 6 days

function sign(userId: string, expiresAt: number): string {
  return createHmac("sha256", env.qrTokenSecret)
    .update(`${userId}:${expiresAt}`)
    .digest("hex")
}

const userInclude = {
  select: {
    id: true,
    email: true,
    role: true,
    studentProfile: { select: { firstName: true, lastName: true } },
    implementorProfile: { select: { firstName: true, lastName: true } },
    cadetOfficerProfile: { select: { firstName: true, lastName: true } },
  },
} as const

// Minimum time between a check-in and the check-out scan
const MIN_CHECKOUT_GAP_MS = 60_000

export async function generateQRToken(userId: string) {
  const expiresAt = Date.now() + TOKEN_VALIDITY_MS
  const token = `${userId}:${expiresAt}:${sign(userId, expiresAt)}`
  const expiresIn = Math.floor(TOKEN_VALIDITY_MS / 1000)
  return { token, expiresIn }
}

export async function scanQR(token: string, scannerId: string, scannerProgram?: NstpType | null, sectionId?: string) {
  const parts = token.split(":")
  if (parts.length !== 3) {
    throw new Error("Invalid QR token format")
  }

  const [userId, expiresAtStr, providedSig] = parts
  const expiresAt = parseInt(expiresAtStr, 10)
  if (isNaN(expiresAt)) {
    throw new Error("Invalid QR token")
  }

  if (Date.now() > expiresAt) {
    throw new Error("QR token expired. Ask the student to show a fresh QR code.")
  }

  const expectedSig = sign(userId, expiresAt)
  // Use constant-time comparison to prevent timing attacks
  const sigBuf = Buffer.from(providedSig, "hex")
  const expectedBuf = Buffer.from(expectedSig, "hex")
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error("Invalid QR token signature")
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error("Student not found")
  }

  if (sectionId) {
    const section = await prisma.section.findUnique({ where: { id: sectionId }, select: { id: true, course: { select: { nstpType: true } } } })
    if (!section) throw new Error("Section not found")
    const enrolled = await prisma.enrollment.findFirst({ where: { userId, sectionId, status: "APPROVED" }, select: { id: true } })
    const profile = enrolled ? null : await prisma.studentProfile.findFirst({ where: { userId, sectionId }, select: { id: true } })
    if (!enrolled && !profile) throw new Error("Not enrolled in this section")
  }

  // A program-scoped scanner (e.g. an ROTC-locked implementor) may only record the
  // attendance of students who belong to that program. Program is resolved from the
  // account OR the student's section — legacy null-program students are attributed
  // through their section rather than silently skipped.
  if (scannerProgram) {
    const targetProgram = await userProgram(userId)
    if (!targetProgram) {
      throw new Error("Cannot determine this student's program. Contact the administrator.")
    }
    if (targetProgram !== scannerProgram) {
      throw new Error(`${user.email} belongs to the ${targetProgram} program. This scanner can only record ${scannerProgram} students.`)
    }
  }

  // The attendance date is the UTC calendar day; this matches the session.date
  // convention so a QR-scanned PRESENT record is never de-duplicated against a
  // different midnight for the same calendar day (which would otherwise cause a
  // scanned student to be auto-marked ABSENT).
  const date = utcStartOfDay(new Date())

  const existing = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId, date } },
  })

  const now = new Date()
  let record
  let action: "CHECK_IN" | "CHECK_OUT" = "CHECK_IN"

  if (existing) {
    // First scan of the day checks in, the second scan checks out. Any later scan is rejected.
    if (!existing.checkInAt || existing.status === AttendanceStatus.ABSENT) {
      throw new Error(`${user.email} already has an attendance record for today (${existing.status})`)
    }
    if (existing.checkOutAt) {
      throw new Error(`${user.email} already checked in and out today`)
    }
    // Guard against an accidental double scan being read as a check-out
    if (now.getTime() - existing.checkInAt.getTime() < MIN_CHECKOUT_GAP_MS) {
      throw new Error(`${user.email} just checked in. Wait a minute before scanning to check out.`)
    }
    action = "CHECK_OUT"
    record = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOutAt: now },
    })
    await logAudit("UPDATE", "AttendanceRecord", record.id, scannerId)
    return { record, action, student: await findScannedStudent(userId) }
  }

  record = await prisma.attendanceRecord.create({
    data: {
      userId,
      date,
      checkInAt: now,
      status: AttendanceStatus.PRESENT,
      sessionId: null,
    },
  })

  await logAudit("CREATE", "AttendanceRecord", record.id, scannerId)
  await checkAndMarkAbsences(userId)

  return { record, action, student: await findScannedStudent(userId) }
}

function findScannedStudent(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      studentProfile: { select: { firstName: true, lastName: true } },
      implementorProfile: { select: { firstName: true, lastName: true } },
      cadetOfficerProfile: { select: { firstName: true, lastName: true } },
    },
  })
}

export async function listAttendance(
  filters: { date?: Date; userId?: string; sectionId?: string; flightId?: string; program?: NstpType },
  skip: number,
  take: number
) {
  const where: Record<string, unknown> = {}
  if (filters.date) where.date = filters.date
  if (filters.userId) where.userId = filters.userId
  const userWhere: Record<string, unknown> = {}
  if (filters.sectionId || filters.flightId) {
    userWhere.studentProfile = {
      sectionId: filters.sectionId,
      flightId: filters.flightId,
    }
  }
  // Scope attendance to a program: match students carrying the program on their
  // account, or enrolled in a section of that program (covers legacy students).
  if (filters.program) {
    userWhere.OR = [
      { program: filters.program },
      { studentProfile: { section: { course: { nstpType: filters.program } } } }
    ]
  }
  if (Object.keys(userWhere).length > 0) {
    where.user = userWhere
  }

  const [items, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      skip,
      take,
      include: { user: userInclude },
      orderBy: { date: "desc" },
    }),
    prisma.attendanceRecord.count({ where }),
  ])
  return { items, total }
}
