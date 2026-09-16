import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"
import { createNotification } from "./notificationService.js"

export const MAX_ABSENCES = 3

export async function checkAndMarkAbsences(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { status: true, firstName: true, lastName: true }
  })

  if (!profile) return profile

  // Count distinct calendar dates carrying an ABSENT record so the metric is
  // resilient against duplicate rows from concurrent endSession / QR mismatches.
  const distinctAbsenceDates = await prisma.attendanceRecord.groupBy({
    by: ["date"],
    where: { userId, status: "ABSENT" },
  })
  const absenceCount = distinctAbsenceDates.length

  // Allow recovery: when duplicates have been pruned and absences are now within
  // tolerance, restore the student to ACTIVE (previously permanently locked to
  // FAILED_ABSENCES with no recovery path).
  if (profile.status === "FAILED_ABSENCES" && absenceCount <= MAX_ABSENCES) {
    await prisma.studentProfile.update({
      where: { userId },
      data: { status: "ACTIVE" }
    })
    await createNotification(
      userId,
      "GENERAL",
      "Attendance Status Restored",
      "Your attendance status has been restored to ACTIVE."
    )
    await logAudit("UPDATE", "StudentProfile", userId, userId)
    return { status: "ACTIVE" as const }
  }

  if (profile.status === "FAILED_ABSENCES") return profile

  if (absenceCount === MAX_ABSENCES) {
    await createNotification(
      userId,
      "THREE_ABSENCES",
      "Attendance Warning",
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
    where: { status: { in: ["ACTIVE", "FAILED_ABSENCES"] } },
    select: { userId: true, status: true }
  })
  if (students.length === 0) {
    return { checked: 0, failed: [] }
  }

  // Group by user and date to get a per-student distinct-date absence count
  const grouped = await prisma.attendanceRecord.groupBy({
    by: ["userId", "date"],
    where: { userId: { in: students.map((s) => s.userId) }, status: "ABSENT" },
  })
  const countsByUser = new Map<string, number>()
  for (const g of grouped) {
    countsByUser.set(g.userId, (countsByUser.get(g.userId) ?? 0) + 1)
  }

  const failed: string[] = []
  for (const student of students) {
    const absenceCount = countsByUser.get(student.userId) ?? 0

    // Recovery: restore ACTIVE when absences have dropped to/below the limit
    if (student.status === "FAILED_ABSENCES" && absenceCount <= MAX_ABSENCES) {
      await prisma.studentProfile.update({
        where: { userId: student.userId },
        data: { status: "ACTIVE" }
      })
      await logAudit("UPDATE", "StudentProfile", student.userId, student.userId)
      continue
    }
    if (student.status === "FAILED_ABSENCES") continue

    if (absenceCount === MAX_ABSENCES) {
      await createNotification(
        student.userId,
        "THREE_ABSENCES",
        "Attendance Warning",
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
  const grouped = await prisma.attendanceRecord.groupBy({
    by: ["date"],
    where: { userId, status: "ABSENT" },
  })
  return grouped.length
}
