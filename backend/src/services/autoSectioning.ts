import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

const STUDENTS_PER_SECTION = 28

/* Compute the next collision-safe `SEC-xx` code across the WHOLE system, because
   Section.code is globally unique — numbering only within the course would collide
   with sections created for another course (or the SEC- prefix used elsewhere). */
async function nextSectionCode(): Promise<{ code: string; ordinal: number }> {
  const allCodes = await prisma.section.findMany({ select: { code: true } })
  let maxOrdinal = 0
  for (const { code } of allCodes) {
    const match = /^SEC-(\d+)$/i.exec(code.trim())
    if (match) {
      const ordinal = parseInt(match[1], 10)
      if (ordinal > maxOrdinal) maxOrdinal = ordinal
    }
  }
  const ordinal = maxOrdinal + 1
  return { code: `SEC-${String(ordinal).padStart(2, "0")}`, ordinal }
}

export async function autoSectionEnrollees(courseId: string) {
  // Determine the course's NSTP program so we never section a student into the other program
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { nstpType: true },
  })
  if (!course) {
    throw new Error("Course not found")
  }

  const unassignedEnrollments = await prisma.enrollment.findMany({
    where: {
      status: "APPROVED",
      sectionId: null,
      user: {
        role: "STUDENT",
        studentProfile: { isNot: null },
        // Only students whose program matches the course — a student without a
        // program must never be auto-placed into the wrong NSTP component.
        program: course.nstpType,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          studentProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  if (unassignedEnrollments.length === 0) {
    return { assigned: 0, sections: [] }
  }

  const sorted = unassignedEnrollments
    .filter((e) => e.user.studentProfile)
    .sort((a, b) => {
      const profileA = a.user.studentProfile!
      const profileB = b.user.studentProfile!
      const lastCmp = profileA.lastName.localeCompare(profileB.lastName)
      if (lastCmp !== 0) return lastCmp
      return profileA.firstName.localeCompare(profileB.firstName)
    })

  const seen: Record<string, boolean> = {}
  const deduped = sorted.filter((e) => {
    if (seen[e.user.id]) return false
    seen[e.user.id] = true
    return true
  })

  // Existing sections of this course, with how many APPROVED students they already hold,
  // so we fill free capacity before spawning brand-new sections.
  const existingSections = await prisma.section.findMany({
    where: { courseId },
    include: {
      _count: {
        select: { enrollments: { where: { status: "APPROVED" } } },
      },
    },
    orderBy: { code: "asc" },
  })

  // Build a target roster: index -> sectionId. First students fill existing free slots.
  const plan: { sectionId: string; sectionCode: string; sectionName: string }[] = []
  let cursor = 0
  for (const section of existingSections) {
    const free = Math.max(0, STUDENTS_PER_SECTION - section._count.enrollments)
    if (free > 0) {
      for (let i = 0; i < Math.min(free, deduped.length - cursor); i++) {
        plan.push({ sectionId: section.id, sectionCode: section.code, sectionName: section.name })
      }
      cursor += Math.min(free, deduped.length - cursor)
      if (cursor >= deduped.length) break
    }
  }

  const newSections: { id: string; code: string; name: string }[] = []
  const remaining = deduped.length - cursor
  const newSectionsNeeded = remaining > 0 ? Math.ceil(remaining / STUDENTS_PER_SECTION) : 0
  for (let n = 0; n < newSectionsNeeded; n++) {
    const { code, ordinal } = await nextSectionCode()
    const section = await prisma.section.create({
      data: { code, name: `Section ${ordinal}`, courseId },
    })
    await logAudit("CREATE", "Section", section.id)
    newSections.push({ id: section.id, code, name: section.name })
    for (let i = 0; i < STUDENTS_PER_SECTION && cursor < deduped.length; i++) {
      plan.push({ sectionId: section.id, sectionCode: code, sectionName: section.name })
      cursor++
    }
  }

  const assignments: { enrollmentId: string; userId: string; sectionCode: string }[] = []
  const sectionCounts = new Map<string, number>()

  for (let i = 0; i < deduped.length && i < plan.length; i++) {
    const enrollment = deduped[i]
    const target = plan[i]
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { sectionId: target.sectionId },
    })

    await prisma.studentProfile.update({
      where: { userId: enrollment.user.id },
      data: { sectionId: target.sectionId },
    })

    await logAudit("UPDATE", "Enrollment", enrollment.id, undefined, {
      sectionId: target.sectionId,
      sectionCode: target.sectionCode,
    })

    sectionCounts.set(target.sectionCode, (sectionCounts.get(target.sectionCode) ?? 0) + 1)
    assignments.push({
      enrollmentId: enrollment.id,
      userId: enrollment.user.id,
      sectionCode: target.sectionCode,
    })
  }

  const sectionSummary = Array.from(sectionCounts.entries()).map(([code, count]) => {
    const existing = existingSections.find((s) => s.code === code)
    const created = newSections.find((s) => s.code === code)
    return {
      sectionId: existing?.id ?? created!.id,
      sectionCode: code,
      studentCount: count,
    }
  })

  return {
    assigned: assignments.length,
    sections: sectionSummary,
    assignments,
  }
}