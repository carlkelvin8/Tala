import { EnrollmentStatus } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

export async function createEnrollment(data: { userId: string; sectionId?: string; flightId?: string }) {
  const existing = await prisma.enrollment.findFirst({
    where: { userId: data.userId, status: { not: "REJECTED" } }
  })
  if (existing) {
    throw new Error("Student already has an active enrollment")
  }
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: data.userId,
      sectionId: data.sectionId,
      flightId: data.flightId
    }
  })
  await logAudit("CREATE", "Enrollment", enrollment.id)
  return enrollment
}

export async function bulkCreateEnrollments(data: { enrollments: { userId: string; sectionId?: string; flightId?: string }[] }) {
  const results: { created: number; skipped: number; errors: string[] } = { created: 0, skipped: 0, errors: [] }
  
  for (const enrollment of data.enrollments) {
    try {
      const existing = await prisma.enrollment.findFirst({
        where: { userId: enrollment.userId, status: { not: "REJECTED" } }
      })
      if (existing) {
        results.skipped++
        continue
      }
      await prisma.enrollment.create({
        data: {
          userId: enrollment.userId,
          sectionId: enrollment.sectionId,
          flightId: enrollment.flightId
        }
      })
      results.created++
    } catch (error) {
      results.errors.push(error instanceof Error ? error.message : "Unknown error")
    }
  }
  
  await logAudit("BULK_CREATE", "Enrollment", undefined, undefined, { count: results.created })
  return results
}

export async function updateEnrollmentStatus(id: string, status: EnrollmentStatus) {
  const enrollment = await prisma.enrollment.update({
    where: { id },
    data: { status }
  })
  await logAudit("UPDATE", "Enrollment", id)
  return enrollment
}

export async function listEnrollments(filters: {
  status?: EnrollmentStatus
  sectionId?: string
  flightId?: string
  search?: string
}, skip: number, take: number) {
  const where: Record<string, unknown> = {}
  if (filters.status) where.status = filters.status
  if (filters.sectionId) where.sectionId = filters.sectionId
  if (filters.flightId) where.flightId = filters.flightId
  if (filters.search && filters.search.trim()) {
    where.OR = [
      {
        user: {
          email: { contains: filters.search.trim(), mode: "insensitive" }
        }
      },
      {
        userId: { contains: filters.search.trim(), mode: "insensitive" }
      }
    ]
  }
  const [items, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            studentProfile: {
              select: {
                firstName: true,
                lastName: true,
                studentNo: true
              }
            }
          }
        },
        section: {
          include: {
            course: true
          }
        },
        flight: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.enrollment.count({ where })
  ])
  return { items, total }
}

/**
 * Bulk-import students from parsed CSV rows.
 * Creates User (STUDENT) + StudentProfile + Enrollment per row.
 * Rows are skipped when the email or student number already exists.
 */
export async function importStudents(data: {
  rows: {
    email: string
    firstName: string
    lastName: string
    studentNo: string
    gender?: string
    birthDate?: string
    contactNo?: string
    sectionCode?: string
  }[]
  enrollmentStatus?: "PENDING" | "APPROVED"
  defaultPassword?: string
}) {
  const bcryptModule = await import("bcryptjs")
  const results = { created: 0, skipped: 0, failed: 0, errors: [] as string[] }

  const sections = await prisma.section.findMany({ select: { id: true, code: true } })
  const sectionMap = new Map(sections.map((s) => [s.code.toUpperCase(), s.id]))

  for (const row of data.rows) {
    try {
      if (!row.email || !row.firstName || !row.lastName || !row.studentNo) {
        results.failed++
        results.errors.push(`Missing required fields for row (${row.email || row.studentNo || "unknown"})`)
        continue
      }

      const emailExists = await prisma.user.findUnique({ where: { email: row.email.trim().toLowerCase() } })
      const studentNoExists = await prisma.studentProfile.findUnique({ where: { studentNo: row.studentNo.trim() } })
      if (emailExists || studentNoExists) {
        results.skipped++
        continue
      }

      const passwordHash = await bcryptModule.hash(data.defaultPassword ?? "Password123!", 10)
      const user = await prisma.user.create({
        data: {
          email: row.email.trim().toLowerCase(),
          passwordHash,
          role: "STUDENT",
        },
      })

      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          studentNo: row.studentNo.trim(),
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          ...(row.gender?.trim() ? { gender: row.gender.trim() } : {}),
          ...(row.birthDate && !Number.isNaN(new Date(row.birthDate).getTime()) ? { birthDate: new Date(row.birthDate) } : {}),
          ...(row.contactNo?.trim() ? { contactNo: row.contactNo.trim() } : {}),
          ...(row.sectionCode ? (() => {
            const sectionId = sectionMap.get(row.sectionCode.trim().toUpperCase())
            return sectionId ? { sectionId } : {}
          })() : {}),
        },
      })

      const sectionId = row.sectionCode ? sectionMap.get(row.sectionCode.trim().toUpperCase()) : undefined
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          ...(sectionId ? { sectionId } : {}),
          status: data.enrollmentStatus ?? "APPROVED",
        },
      })

      results.created++
    } catch (error) {
      results.failed++
      results.errors.push(`${row.email ?? "unknown"}: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  await logAudit("BULK_CREATE", "Enrollment", undefined, undefined, { imported: results.created, source: "csv" })
  return results
}
