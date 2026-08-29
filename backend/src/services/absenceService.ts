import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"
import { createNotification } from "./notificationService.js"

export const MAX_ABSENCES = 3

export async function checkAndMarkAbsences(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { status: true, firstName: true, lastName: true }
  })

  if (!profile || profile.status === "FAILED_ABSENCES") return profile

  const absenceCount = await prisma.attendanceRecord.count({
    where: {
      userId,
      status: "ABSENT"
    }
  })

  if (absenceCount === MAX_ABSENCES) {
    await createNotification(
      userId,
      "THREE_ABSENCES",
      "3 Consecutive Absences Warning",
      `You have reached ${MAX_ABSENCES} absences. One more absence will result in failing due to attendance requirements.`
    )
  }

  if (absenceCount > MAX_ABSENCES) {
    await prisma.studentProfile.update({
      where: { userId },
      data: { status: "FAILED_ABSENCES" }
    })
    await createNotification(
      userId,
      "FAILED_ABSENCES",
      "Failed Due to Absences",
      `You have been marked as FAILED due to exceeding ${MAX_ABSENCES} absences. Please contact your instructor.`
    )
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
  if (students.length === 0) {
    return { checked: 0, failed: [] }
  }

  const absentCounts = await prisma.attendanceRecord.groupBy({
    by: ["userId"],
    where: { userId: { in: students.map((s) => s.userId) }, status: "ABSENT" },
    _count: { _all: true },
  })
  const counts = new Map(absentCounts.map((g) => [g.userId, g._count._all]))

  const failed: string[] = []
  for (const student of students) {
    const absenceCount = counts.get(student.userId) ?? 0
    if (absenceCount === MAX_ABSENCES) {
      await createNotification(
        student.userId,
        "THREE_ABSENCES",
        "3 Consecutive Absences Warning",
        `You have reached ${MAX_ABSENCES} absences. One more absence will result in failing due to attendance requirements.`
      )
    }
    if (absenceCount > MAX_ABSENCES) {
      await prisma.studentProfile.update({
        where: { userId: student.userId },
        data: { status: "FAILED_ABSENCES" }
      })
      await createNotification(
        student.userId,
        "FAILED_ABSENCES",
        "Failed Due to Absences",
        `You have been marked as FAILED due to exceeding ${MAX_ABSENCES} absences. Please contact your instructor.`
      )
      await logAudit("UPDATE", "StudentProfile", student.userId, student.userId)
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
