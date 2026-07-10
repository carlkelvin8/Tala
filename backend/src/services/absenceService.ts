import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

export const MAX_ABSENCES = 3

export async function checkAndMarkAbsences(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { status: true }
  })

  if (!profile || profile.status === "FAILED_ABSENCES") return profile

  const absenceCount = await prisma.attendanceRecord.count({
    where: {
      userId,
      status: "ABSENT"
    }
  })

  if (absenceCount > MAX_ABSENCES) {
    await prisma.studentProfile.update({
      where: { userId },
      data: { status: "FAILED_ABSENCES" }
    })
    await logAudit("UPDATE", "StudentProfile", userId, userId)
    return { status: "FAILED_ABSENCES" as const }
  }

  return profile
}

export async function bulkCheckAbsences() {
  const students = await prisma.studentProfile.findMany({
    where: { status: "ACTIVE" },
    select: { userId: true }
  })

  const failed: string[] = []
  for (const student of students) {
    const result = await checkAndMarkAbsences(student.userId)
    if (result?.status === "FAILED_ABSENCES") {
      failed.push(student.userId)
    }
  }
  return { checked: students.length, failed }
}

export async function getAbsenceCount(userId: string) {
  return prisma.attendanceRecord.count({
    where: {
      userId,
      status: "ABSENT"
    }
  })
}
