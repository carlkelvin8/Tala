import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

export async function createGradeCategory(name: string, weight?: number) {
  const category = await prisma.gradeCategory.create({ data: { name, weight } })
  await logAudit("CREATE", "GradeCategory", category.id)
  return category
}

export async function createGradeItem(title: string, maxScore: number, categoryId: string) {
  const item = await prisma.gradeItem.create({ data: { title, maxScore, categoryId } })
  await logAudit("CREATE", "GradeItem", item.id)
  return item
}

export async function encodeStudentGrade(studentId: string, gradeItemId: string, score: number, encodedById: string) {
  const grade = await prisma.studentGrade.create({
    data: { studentId, gradeItemId, score, encodedById }
  })
  await logAudit("CREATE", "StudentGrade", grade.id, encodedById)
  return grade
}

export async function listGrades(filters: { studentId?: string }, skip: number, take: number) {
  const where: Record<string, unknown> = {}
  if (filters.studentId) where.studentId = filters.studentId
  const [items, total] = await Promise.all([
    prisma.studentGrade.findMany({
      where,
      skip,
      take,
      include: {
        student: {
          select: {
            id: true,
            email: true,
            studentProfile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        gradeItem: { include: { category: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.studentGrade.count({ where })
  ])
  return { items, total }
}


export async function updateGrade(id: string, score: number, userId: string) {
  const grade = await prisma.studentGrade.update({
    where: { id },
    data: { score },
  })
  await logAudit("UPDATE", "StudentGrade", grade.id, userId)
  return grade
}

export async function deleteGrade(id: string, userId: string) {
  await prisma.studentGrade.delete({ where: { id } })
  await logAudit("DELETE", "StudentGrade", id, userId)
}

export async function updateGradeItem(id: string, data: { title?: string; maxScore?: number; categoryId?: string }, userId: string) {
  const item = await prisma.gradeItem.update({
    where: { id },
    data,
  })
  await logAudit("UPDATE", "GradeItem", item.id, userId)
  return item
}

export async function deleteGradeItem(id: string, userId: string) {
  await prisma.gradeItem.delete({ where: { id } })
  await logAudit("DELETE", "GradeItem", id, userId)
}

export async function updateGradeCategory(id: string, data: { name?: string; weight?: number }, userId: string) {
  const category = await prisma.gradeCategory.update({
    where: { id },
    data,
  })
  await logAudit("UPDATE", "GradeCategory", category.id, userId)
  return category
}

export async function deleteGradeCategory(id: string, userId: string) {
  await prisma.gradeCategory.delete({ where: { id } })
  await logAudit("DELETE", "GradeCategory", id, userId)
}
