import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

export async function createTerm(data: { name: string; startDate: string; endDate: string; isActive?: boolean }) {
  if (data.isActive) {
    await prisma.academicTerm.updateMany({ where: { isActive: true }, data: { isActive: false } })
  }
  const term = await prisma.academicTerm.create({
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: data.isActive ?? false
    }
  })
  await logAudit("CREATE", "AcademicTerm", term.id)
  return term
}

export async function listTerms() {
  return prisma.academicTerm.findMany({ orderBy: { startDate: "desc" } })
}

export async function getActiveTerm() {
  return prisma.academicTerm.findFirst({ where: { isActive: true } })
}

export async function updateTerm(id: string, data: { name?: string; startDate?: string; endDate?: string; isActive?: boolean }) {
  if (data.isActive) {
    await prisma.academicTerm.updateMany({ where: { isActive: true, id: { not: id } }, data: { isActive: false } })
  }
  const term = await prisma.academicTerm.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined
    }
  })
  await logAudit("UPDATE", "AcademicTerm", id)
  return term
}

export async function deleteTerm(id: string) {
  await prisma.academicTerm.delete({ where: { id } })
  await logAudit("DELETE", "AcademicTerm", id)
}
