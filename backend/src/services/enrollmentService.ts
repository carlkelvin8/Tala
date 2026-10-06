import { EnrollmentStatus, NstpType } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"
import { userProgram as resolveUserProgram } from "./programGuard.js"
import { notifySafe } from "./notificationService.js"

/* Keep the student's profile section in sync with their active enrollment so
   section-scoped list endpoints never collapse to the whole database. */
export async function syncStudentSection(userId: string, sectionId: string | null | undefined) {
  await prisma.studentProfile.updateMany({
    where: { userId },
    data: { sectionId: sectionId ?? null }
  })
}

/* Reject enrollments that would move a student onto the other NSTP program.
   ROTC -> CWTS (or CWTS -> ROTC) exchanges are not allowed.
   The student's program is whatever it resolves to — account field OR assigned
   section — so legacy null-program students cannot be moved across programs. */
async function assertProgramMatch(userId: string, sectionId?: string | null) {
  if (!sectionId) return
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { course: { select: { nstpType: true } } }
  })
  const sectionProgram = section?.course?.nstpType ?? null
  if (!sectionProgram) return
  const program = await resolveUserProgram(userId)
  if (program && program !== sectionProgram) {
    throw new Error(
      `Cannot enroll: the student belongs to the ${program} program, but this section is under ${sectionProgram}. Program transfers are not allowed.`
    )
  }
}

/* Reject duplicate enrollments to the same target (section or flight).
   The per-user active-enrollment check is not enough: a PENDING/APPROVED
   enrollment for the same section (or flight) should not be re-created. */
async function assertNoDuplicateTarget(userId: string, sectionId?: string | null, flightId?: string | null) {
  if (sectionId) {
    const dup = await prisma.enrollment.findFirst({
      where: { userId, sectionId, status: { in: ["PENDING", "APPROVED"] } }
    })
    if (dup) {
      throw new Error("This student is already enrolled in that section")
    }
  }
  if (flightId) {
    const dup = await prisma.enrollment.findFirst({
      where: { userId, flightId, status: { in: ["PENDING", "APPROVED"] } }
    })
    if (dup) {
      throw new Error("This student is already enrolled in that flight")
    }
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
  await assertNoDuplicateTarget(data.userId, data.sectionId, data.flightId)
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: data.userId,
      sectionId: data.sectionId,
      flightId: data.flightId
    }
  })
  // NOTE: the profile section is intentionally NOT synced here. PENDING students
  // must not gain section access (or get auto-ABSENT) before they are approved;
  // the section is applied only when the enrollment is APPROVED.
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
      await assertProgramMatch(enrollment.userId, enrollment.sectionId)
      await assertNoDuplicateTarget(enrollment.userId, enrollment.sectionId, enrollment.flightId)
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
    const userProgramValue = await resolveUserProgram(enrollment.userId)
    if (sectionProgram && userProgramValue && sectionProgram !== userProgramValue) {
      throw new Error(
        `Cannot approve: the student belongs to ${userProgramValue}, but this section is under ${sectionProgram}. Program transfers are not allowed.`
      )
    }
    // Guard against double-active enrollments: approving this record must not
    // leave the student with another concurrent PENDING/APPROVED enrollment.
    const otherActive = await prisma.enrollment.findFirst({
      where: { userId: enrollment.userId, id: { not: id }, status: { in: ["PENDING", "APPROVED"] } },
      select: { id: true },
    })
    if (otherActive) {
      throw new Error("Student already has an active enrollment")
    }
  }
  const updated = await prisma.enrollment.update({
    where: { id },
    data: { status }
  })
  // Profile section follows the enrollment lifecycle: the section is granted ONLY
  // on APPROVED (never on PENDING — pending students must not gain section access)
  // and cleared when the enrollment is REJECTED so rejected students drop out.
  if (status === EnrollmentStatus.APPROVED) {
    await syncStudentSection(enrollment.userId, enrollment.sectionId)
  } else if (status === EnrollmentStatus.REJECTED) {
    await syncStudentSection(enrollment.userId, null)
  }
  await logAudit("UPDATE", "Enrollment", id)
  if (status === EnrollmentStatus.APPROVED) {
    await notifySafe(
      enrollment.userId,
      "Enrollment Approved",
      enrollment.section ? `Your enrollment has been approved. Section: ${enrollment.section.code}.` : "Your enrollment has been approved."
    )
  } else if (status === EnrollmentStatus.REJECTED) {
    await notifySafe(enrollment.userId, "Enrollment Rejected", "Your enrollment was not approved. Please contact your instructor.")
  }
  return updated
}

export async function listEnrollments(filters: {
  status?: EnrollmentStatus
  sectionId?: string
  flightId?: string
  search?: string
  program?: NstpType
}, skip: number, take: number) {
  // Soft-deleted users never appear in enrollment listings
  const where: Record<string, unknown> = {}
  const userScope: Record<string, unknown>[] = [{ deletedAt: null }]
  if (filters.status) where.status = filters.status
  if (filters.sectionId) where.sectionId = filters.sectionId
  if (filters.flightId) where.flightId = filters.flightId
  // Scope to a program: match students carrying the program on their account, or
  // enrolled in a section of that program (covers legacy students without a program).
  if (filters.program) {
    userScope.push({
      OR: [
        { program: filters.program },
        { studentProfile: { section: { course: { nstpType: filters.program } } } }
      ]
    })
  }
  where.user = { AND: userScope }
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
            program: true,
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
      // A provided-but-unknown section code must fail the row instead of silently
      // approving the student with no section (which would hide them from rosters).
      if (row.sectionCode && row.sectionCode.trim() && !sectionInfo) {
        results.failed++
        results.errors.push(`${row.email ?? row.studentNo}: Unknown section code "${row.sectionCode.trim().toUpperCase()}"`)
        continue
      }
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
