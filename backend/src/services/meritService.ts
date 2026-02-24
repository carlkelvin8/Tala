import { MeritType } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

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

export async function listMerits(filters: { studentId?: string; type?: MeritType }, skip: number, take: number) {
  const where: Record<string, unknown> = {}
  if (filters.studentId) where.studentId = filters.studentId
  if (filters.type) where.type = filters.type
  const [items, total] = await Promise.all([
    prisma.meritDemerit.findMany({
      where,
      skip,
      take,
      include: { student: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.meritDemerit.count({ where })
  ])
  return { items, total }
}
