import { EnrollmentStatus, NstpType } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

/* Reject enrollments that would move a student onto the other NSTP program.
   ROTC -> CWTS (or CWTS -> ROTC) exchanges are not allowed. */
async function assertProgramMatch(userId: string, sectionId?: string | null) {
  if (!sectionId) return
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { course: { select: { nstpType: true } } }
  })
  const sectionProgram = section?.course?.nstpType ?? null
  if (!sectionProgram) return
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { program: true } })
  if (user?.program && user.program !== sectionProgram) {
    throw new Error(
      `Cannot enroll: the student belongs to the ${user.program} program, but this section is under ${sectionProgram}. Program transfers are not allowed.`
    )
  }
}

export async function createEnrollment(data: { userId: string; sectionId?: string; flightId?: string }) {
  const existing = await prisma.enrollment.findFirst({
    where: { userId: data.userId, status: { not: "REJECTED" } }
  })
  if (existing) {
    throw new Error("Student already has an active enrollment")
  }
  await assertProgramMatch(data.userId, data.sectionId)
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
  const enrollment = await prisma.enrollment.findFirst({
    where: { id },
    include: {
      user: { select: { program: true } },
      section: { include: { course: { select: { nstpType: true } } } }
    }
  })
  if (!enrollment) {
    throw new Error("Enrollment not found")
  }
  // Neither an ROTC student into a CWTS section nor a CWTS student into an ROTC
  // section may be approved — approving one would complete a prohibited program swap.
  if (status === EnrollmentStatus.APPROVED) {
    const sectionProgram = enrollment.section?.course?.nstpType ?? null
    const userProgram = enrollment.user?.program ?? null
    if (sectionProgram && userProgram && sectionProgram !== userProgram) {
      throw new Error(
        `Cannot approve: the student belongs to ${userProgram}, but this section is under ${sectionProgram}. Program transfers are not allowed.`
      )
    }
  }
  const updated = await prisma.enrollment.update({
    where: { id },
    data: { status }
  })
  await logAudit("UPDATE", "Enrollment", id)
  return updated
}

export async function listEnrollments(filters: {
  status?: EnrollmentStatus
  sectionId?: string
  flightId?: string
  search?: string
  program?: NstpType
}, skip: number, take: number) {
  const where: Record<string, unknown> = {}
  if (filters.status) where.status = filters.status
  if (filters.sectionId) where.sectionId = filters.sectionId
  if (filters.flightId) where.flightId = filters.flightId
  // Scope to a program: match students carrying the program on their account, or
  // enrolled in a section of that program (covers legacy students without a program).
  if (filters.program) {
    where.user = {
      OR: [
        { program: filters.program },
        { studentProfile: { section: { course: { nstpType: filters.program } } } }
      ]
    }
  }
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

  const sections = await prisma.section.findMany({
    select: { id: true, code: true, course: { select: { nstpType: true } } }
  })
  const sectionMap = new Map(sections.map((s) => [s.code.toUpperCase(), { id: s.id, program: s.course?.nstpType ?? null }]))

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
      const sectionInfo = row.sectionCode ? sectionMap.get(row.sectionCode.trim().toUpperCase()) : undefined
      const user = await prisma.user.create({
        data: {
          email: row.email.trim().toLowerCase(),
          passwordHash,
          role: "STUDENT",
          // Imported students inherit the program of their assigned section
          ...(sectionInfo?.program ? { program: sectionInfo.program } : {}),
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
          ...(sectionInfo ? { sectionId: sectionInfo.id } : {}),
        },
      })

      await prisma.enrollment.create({
        data: {
          userId: user.id,
          ...(sectionInfo ? { sectionId: sectionInfo.id } : {}),
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
