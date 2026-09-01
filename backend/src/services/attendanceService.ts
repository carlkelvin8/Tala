import { AttendanceStatus, NstpType } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"
import { checkAndMarkAbsences } from "./absenceService.js"
import { userProgram } from "./programGuard.js"
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

export async function generateQRToken(userId: string) {
  const expiresAt = Date.now() + TOKEN_VALIDITY_MS
  const token = `${userId}:${expiresAt}:${sign(userId, expiresAt)}`
  const expiresIn = Math.floor(TOKEN_VALIDITY_MS / 1000)
  return { token, expiresIn }
}

export async function scanQR(token: string, scannerId: string, scannerProgram?: NstpType | null) {
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

  const today = new Date()
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const existing = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId, date } },
  })

  if (existing) {
    throw new Error(`${user.email} already scanned for today (${existing.status})`)
  }

  const now = new Date()
  const record = await prisma.attendanceRecord.create({
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

  return {
    record,
    student: await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        studentProfile: { select: { firstName: true, lastName: true } },
        implementorProfile: { select: { firstName: true, lastName: true } },
        cadetOfficerProfile: { select: { firstName: true, lastName: true } },
      },
    }),
  }
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
