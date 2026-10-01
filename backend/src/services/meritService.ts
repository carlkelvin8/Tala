import { MeritType, NstpType } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"
import { assertUserInProgram } from "./programGuard.js"
import { programUserScope } from "./programScope.js"

/* Assign a merit or demerit to a student */
export async function assignMerit(data: {
  studentId: string
  type: MeritType
  points: number
  reason: string
  encodedById: string
}, scopeProgram?: NstpType | null) {
  // Scoped staff may only assign merits to students of their own program
  await assertUserInProgram(data.studentId, scopeProgram)
  const merit = await prisma.meritDemerit.create({ data: { ...data } })
  await logAudit("CREATE", "MeritDemerit", merit.id, data.encodedById)
  return merit
}

/* Update an existing merit/demerit record */
export async function updateMerit(id: string, data: {
  type?: MeritType
  points?: number
  reason?: string
}, actorId: string, scopeProgram?: NstpType | null) {
  const existing = await prisma.meritDemerit.findUnique({ where: { id } })
  if (!existing) {
    throw new Error("Merit record not found")
  }
  // Scoped staff may only update merits of students inside their program
  await assertUserInProgram(existing.studentId, scopeProgram)
  const updated = await prisma.meritDemerit.update({ where: { id }, data })
  await logAudit("UPDATE", "MeritDemerit", id, actorId)
  return updated
}

/* Delete a merit/demerit record */
export async function deleteMerit(id: string, actorId: string, scopeProgram?: NstpType | null) {
  const existing = await prisma.meritDemerit.findUnique({ where: { id } })
  if (!existing) {
    throw new Error("Merit record not found")
  }
  // Scoped staff may only delete merits of students inside their program
  await assertUserInProgram(existing.studentId, scopeProgram)
  await prisma.meritDemerit.delete({ where: { id } })
  await logAudit("DELETE", "MeritDemerit", id, actorId)
}

export async function listMerits(filters: { studentId?: string; type?: MeritType; sectionId?: string }, skip: number, take: number, scopeProgram?: NstpType | null) {
  const where: Record<string, unknown> = {}
  if (filters.studentId) where.studentId = filters.studentId
  if (filters.type) where.type = filters.type
  if (filters.sectionId) {
    where.student = {
      studentProfile: { sectionId: filters.sectionId }
    }
  }
  // Scoped staff only see merits of students belonging to their program. The
  // scope applies even when a studentId filter is present so a staff member can
  // never read a student outside their program.
  if (scopeProgram) {
    const scope = programUserScope(scopeProgram)
    if (scope) {
      if (where.student) {
        where.student = { AND: [where.student as Record<string, unknown>, scope as Record<string, unknown>] }
      } else {
        where.student = scope
      }
    }
  }
  const [items, total] = await Promise.all([
    prisma.meritDemerit.findMany({
      where,
      skip,
      take,
      include: {
        student: {
          select: {
            id: true,
            email: true,
            role: true,
            studentProfile: { select: { firstName: true, lastName: true } },
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.meritDemerit.count({ where })
  ])
  return { items, total }
}
