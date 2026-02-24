import { MaterialCategory } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

const createdByInclude = {
  select: {
    id: true,
    email: true,
    role: true,
    studentProfile: { select: { firstName: true, lastName: true } },
    implementorProfile: { select: { firstName: true, lastName: true } },
    cadetOfficerProfile: { select: { firstName: true, lastName: true } },
  },
} as const

export async function createMaterial(data: {
  title: string
  description?: string
  category: MaterialCategory
  fileUrl?: string
  createdById: string
  sectionId?: string
  flightId?: string
}) {
  const material = await prisma.learningMaterial.create({ data })
  await logAudit("CREATE", "LearningMaterial", material.id, data.createdById)
  return material
}

export async function listMaterials(
  filters: { category?: MaterialCategory; sectionId?: string; flightId?: string },
  skip: number,
  take: number
) {
  const where: Record<string, unknown> = {}
  if (filters.category) where.category = filters.category
  if (filters.sectionId) where.sectionId = filters.sectionId
  if (filters.flightId) where.flightId = filters.flightId

  const [items, total] = await Promise.all([
    prisma.learningMaterial.findMany({
      where,
      skip,
      take,
      include: { createdBy: createdByInclude },
      orderBy: { createdAt: "desc" },
    }),
    prisma.learningMaterial.count({ where }),
  ])
  return { items, total }
}

export async function updateMaterial(
  id: string,
  data: {
    title?: string
    description?: string
    category?: MaterialCategory
    fileUrl?: string
  },
  userId: string
) {
  const material = await prisma.learningMaterial.update({
    where: { id },
    data,
  })
  await logAudit("UPDATE", "LearningMaterial", material.id, userId)
  return material
}

export async function deleteMaterial(id: string, userId: string) {
  await prisma.learningMaterial.delete({ where: { id } })
  await logAudit("DELETE", "LearningMaterial", id, userId)
}
