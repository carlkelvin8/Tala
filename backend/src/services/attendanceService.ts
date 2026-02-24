import { AttendanceStatus } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

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

export async function checkIn(userId: string, latitude: number, longitude: number) {
  const today = new Date()
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const record = await prisma.attendanceRecord.upsert({
    where: { userId_date: { userId, date } },
    update: { checkInAt: new Date(), latitude, longitude, status: AttendanceStatus.PRESENT },
    create: { userId, date, checkInAt: new Date(), latitude, longitude, status: AttendanceStatus.PRESENT },
  })
  await logAudit("CREATE", "AttendanceRecord", record.id, userId)
  return record
}

export async function checkOut(userId: string, latitude: number, longitude: number) {
  const today = new Date()
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const record = await prisma.attendanceRecord.upsert({
    where: { userId_date: { userId, date } },
    update: { checkOutAt: new Date(), latitude, longitude },
    create: { userId, date, checkOutAt: new Date(), latitude, longitude },
  })
  await logAudit("UPDATE", "AttendanceRecord", record.id, userId)
  return record
}

export async function listAttendance(
  filters: { date?: Date; userId?: string; sectionId?: string; flightId?: string },
  skip: number,
  take: number
) {
  const where: Record<string, unknown> = {}
  if (filters.date) where.date = filters.date
  if (filters.userId) where.userId = filters.userId
  if (filters.sectionId || filters.flightId) {
    where.user = {
      studentProfile: {
        sectionId: filters.sectionId,
        flightId: filters.flightId,
      },
    }
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
