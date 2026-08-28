import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

const STUDENTS_PER_SECTION = 28

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
        // Only students whose program matches the course (or have no program set)
        OR: [{ program: course.nstpType }, { program: null }],
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

  const existingSections = await prisma.section.findMany({
    where: { courseId },
    orderBy: { code: "asc" },
  })

  const sectionsNeeded = Math.ceil(sorted.length / STUDENTS_PER_SECTION)
  const sections: { id: string; code: string; name: string }[] = [...existingSections]

  for (let i = existingSections.length + 1; i <= existingSections.length + sectionsNeeded; i++) {
    const code = `SEC-${String(i).padStart(2, "0")}`
    const name = `Section ${i}`
    const section = await prisma.section.create({
      data: { code, name, courseId },
    })
    await logAudit("CREATE", "Section", section.id)
    sections.push(section)
  }

  const chunks: typeof sorted[] = []
  for (let i = 0; i < sorted.length; i += STUDENTS_PER_SECTION) {
    chunks.push(sorted.slice(i, i + STUDENTS_PER_SECTION))
  }

  const assignments: { enrollmentId: string; userId: string; sectionCode: string }[] = []

  for (let i = 0; i < chunks.length; i++) {
    const section = sections[existingSections.length + i]
    const chunk = chunks[i]

    for (const enrollment of chunk) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { sectionId: section.id },
      })

      await prisma.studentProfile.update({
        where: { userId: enrollment.user.id },
        data: { sectionId: section.id },
      })

      await logAudit("UPDATE", "Enrollment", enrollment.id, undefined, {
        sectionId: section.id,
        sectionCode: section.code,
      })

      assignments.push({
        enrollmentId: enrollment.id,
        userId: enrollment.user.id,
        sectionCode: section.code,
      })
    }
  }

  return {
    assigned: assignments.length,
    sections: chunks.map((chunk, i) => ({
      sectionId: sections[existingSections.length + i].id,
      sectionCode: sections[existingSections.length + i].code,
      studentCount: chunk.length,
    })),
    assignments,
  }
}
