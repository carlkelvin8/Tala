import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

export async function createTerm(data: { name: string; startDate: string; endDate: string; isActive?: boolean }) {
  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)
  if (endDate <= startDate) {
    throw new Error("End date must be after start date")
  }
  if (data.isActive) {
    await prisma.academicTerm.updateMany({ where: { isActive: true }, data: { isActive: false } })
  }
  const term = await prisma.academicTerm.create({
    data: {
      name: data.name,
      startDate,
      endDate,
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
  if (data.startDate || data.endDate) {
    const existing = await prisma.academicTerm.findUnique({ where: { id } })
    if (!existing) throw new Error("Term not found")
    const start = data.startDate ? new Date(data.startDate) : existing.startDate
    const end = data.endDate ? new Date(data.endDate) : existing.endDate
    if (end <= start) {
      throw new Error("End date must be after start date")
    }
  }
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
  const term = await prisma.academicTerm.findUnique({ where: { id } })
  if (!term) throw new Error("Term not found")
  if (term.isActive) {
    throw new Error("Cannot delete the active term. Activate another term first.")
  }
  await prisma.academicTerm.delete({ where: { id } })
  await logAudit("DELETE", "AcademicTerm", id)
}
