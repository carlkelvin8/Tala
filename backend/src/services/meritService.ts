import { MeritType } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

/* Assign a merit or demerit to a student */
export async function assignMerit(data: {
  studentId: string
  type: MeritType
  points: number
  reason: string
  encodedById: string
}) {
  const merit = await prisma.meritDemerit.create({ data })
  await logAudit("CREATE", "MeritDemerit", merit.id, data.encodedById)
  return merit
}

/* Update an existing merit/demerit record */
export async function updateMerit(id: string, data: {
  type?: MeritType
  points?: number
  reason?: string
}, actorId: string) {
  const existing = await prisma.meritDemerit.findUnique({ where: { id } })
  if (!existing) {
    throw new Error("Merit record not found")
  }
  const updated = await prisma.meritDemerit.update({ where: { id }, data })
  await logAudit("UPDATE", "MeritDemerit", id, actorId)
  return updated
}

/* Delete a merit/demerit record */
export async function deleteMerit(id: string, actorId: string) {
  const existing = await prisma.meritDemerit.findUnique({ where: { id } })
  if (!existing) {
    throw new Error("Merit record not found")
  }
  await prisma.meritDemerit.delete({ where: { id } })
  await logAudit("DELETE", "MeritDemerit", id, actorId)
}

export async function listMerits(filters: { studentId?: string; type?: MeritType; sectionId?: string }, skip: number, take: number) {
  const where: Record<string, unknown> = {}
  if (filters.studentId) where.studentId = filters.studentId
  if (filters.type) where.type = filters.type
  if (filters.sectionId) {
    where.student = {
      studentProfile: { sectionId: filters.sectionId }
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
