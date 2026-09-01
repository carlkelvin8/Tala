// Import the Prisma client for database access
import { prisma } from "../lib/prisma.js"
// Import the audit logging helper to record grade management events
import { logAudit } from "./auditService.js"
// Import program scoping helpers to keep program-locked accounts inside their program
import { assertUserInProgram } from "./programGuard.js"
import { programUserScope } from "./programScope.js"
import { NstpType } from "@prisma/client"

/* Compute a student's total grade as a weighted percentage across grade categories.
   Category weights are treated as percentages (e.g. 30, 40, 30); when they are
   stored as fractions (sum <= 2), the result is scaled up to a percentage. */
export function computeWeightedTotalGrade(
  categories: Array<{
    name: string
    weight: number | null
    items: Array<{ maxScore: number; grades: Array<{ score: number }> }>
  }>
) {
  const breakdown = categories.map((category) => {
    let score = 0
    let max = 0
    for (const item of category.items) {
      const grade = item.grades[0]
      if (grade) {
        score += grade.score
        max += item.maxScore
      }
    }
    return { name: category.name, weight: category.weight, score, max }
  })

  // Weighted roll-up must stay relative to the FULL configured weight, otherwise
  // categories that have no graded items yet would silently inflate the total.
  const weighted = breakdown.filter((c) => c.weight && c.weight > 0)
  const graded = weighted.filter((c) => c.max > 0)
  if (graded.length > 0) {
    const weightSum = weighted.reduce((sum, c) => sum + (c.weight ?? 0), 0)
    let total = graded.reduce((sum, c) => sum + (c.score / c.max) * (c.weight ?? 0), 0)
    if (weightSum > 0 && weightSum <= 2) total *= 100
    return { breakdown, totalPercent: Math.min(100, Math.max(0, total)) }
  }

  const score = breakdown.reduce((sum, c) => sum + c.score, 0)
  const max = breakdown.reduce((sum, c) => sum + c.max, 0)
  return {
    breakdown,
    totalPercent: max > 0 ? Math.min(100, Math.max(0, (score / max) * 100)) : null,
  }
}

/* Utility to fetch and compute the weighted total grade per student for a given
   set of student user IDs. Returns a map of userId -> totalPercent (or null). */
export async function computeStudentsTotalGrades(studentIds: string[]) {
  if (studentIds.length === 0) return new Map<string, number | null>()
  const categories = await prisma.gradeCategory.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          grades: { where: { studentId: { in: studentIds } }, select: { studentId: true, score: true } },
        },
      },
    },
  })
  const totals = new Map<string, number | null>()
  for (const studentId of studentIds) {
    const scoped = categories.map((category) => ({
      name: category.name,
      weight: category.weight,
      items: category.items.map((item) => ({
        maxScore: item.maxScore,
        grades: item.grades.filter((g) => g.studentId === studentId).map((g) => ({ score: g.score })),
      })),
    }))
    totals.set(studentId, computeWeightedTotalGrade(scoped).totalPercent)
  }
  return totals
}

/* Create a new grade category */
export async function createGradeCategory(name: string, weight?: number) {
  // Insert a new grade category record with the provided name and optional weight
  const category = await prisma.gradeCategory.create({ data: { name, weight } })
  // Log the category creation event to the audit trail
  await logAudit("CREATE", "GradeCategory", category.id)
  // Return the created category object
  return category
}

/* Create a new grade item within a category */
export async function createGradeItem(title: string, maxScore: number, categoryId: string) {
  // Insert a new grade item record linked to the specified category
  const item = await prisma.gradeItem.create({ data: { title, maxScore, categoryId } })
  // Log the grade item creation event to the audit trail
  await logAudit("CREATE", "GradeItem", item.id)
  // Return the created grade item object
  return item
}

/* Record a student's score for a specific grade item */
export async function encodeStudentGrade(studentId: string, gradeItemId: string, score: number, encodedById: string, scopeProgram?: NstpType | null) {
  // A score can never be negative
  if (score < 0) throw new Error("Score cannot be negative")
  // Check for existing grade for this student and grade item
  const existing = await prisma.studentGrade.findFirst({
    where: { studentId, gradeItemId }
  })
  if (existing) {
    throw new Error("A grade already exists for this student on this item")
  }
  // Validate score does not exceed max score
  const gradeItem = await prisma.gradeItem.findUnique({ where: { id: gradeItemId } })
  if (!gradeItem) {
    throw new Error("Grade item not found")
  }
  if (score > gradeItem.maxScore) {
    throw new Error(`Score cannot exceed maximum score of ${gradeItem.maxScore}`)
  }
  // Scoped staff may only grade students of their own program
  await assertUserInProgram(studentId, scopeProgram)
  // Insert a new student grade record with the score and the encoder's ID
  const grade = await prisma.studentGrade.create({
    data: { studentId, gradeItemId, score, encodedById } // Link to student, item, and encoder
  })
  // Log the grade encoding event to the audit trail with the encoder's ID
  await logAudit("CREATE", "StudentGrade", grade.id, encodedById)
  // Return the created student grade object
  return grade
}

/* Return a paginated list of student grades with optional filters */
export async function listGrades(filters: { studentId?: string; sectionId?: string }, skip: number, take: number, scopeProgram?: NstpType | null) {
  const where: Record<string, unknown> = {}
  if (filters.studentId) where.studentId = filters.studentId
  if (filters.sectionId) {
    where.student = {
      studentProfile: { sectionId: filters.sectionId }
    }
  }
  // Scoped staff only see grades of students belonging to their program
  if (scopeProgram && !filters.studentId) {
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

/* Update a student's score for a grade record */
export async function updateGrade(id: string, score: number, userId: string, scopeProgram?: NstpType | null) {
  // A score can never be negative
  if (score < 0) throw new Error("Score cannot be negative")
  // Fetch the grade record to validate score against max
  const existing = await prisma.studentGrade.findUnique({ where: { id }, include: { gradeItem: true, student: { select: { id: true } } } })
  if (!existing) throw new Error("Grade not found")
  if (score > existing.gradeItem.maxScore) {
    throw new Error(`Score cannot exceed maximum score of ${existing.gradeItem.maxScore}`)
  }
  // Scoped staff may only update grades of their own program
  await assertUserInProgram(existing.student.id, scopeProgram)
  // Update the student grade record with the new score
  const grade = await prisma.studentGrade.update({
    where: { id }, // Target the specific grade record by ID
    data: { score }, // Set the new score value
  })
  // Log the grade update event to the audit trail
  await logAudit("UPDATE", "StudentGrade", grade.id, userId)
  // Return the updated student grade object
  return grade
}

/* Permanently delete a student grade record */
export async function deleteGrade(id: string, userId: string, scopeProgram?: NstpType | null) {
  // Scoped staff may only delete grades of their own program
  const existing = await prisma.studentGrade.findUnique({ where: { id }, select: { student: { select: { id: true } } } })
  if (!existing) throw new Error("Grade not found")
  await assertUserInProgram(existing.student.id, scopeProgram)
  // Delete the student grade record from the database
  await prisma.studentGrade.delete({ where: { id } })
  // Log the grade deletion event to the audit trail
  await logAudit("DELETE", "StudentGrade", id, userId)
}

/* Update a grade item's details */
export async function updateGradeItem(id: string, data: { title?: string; maxScore?: number; categoryId?: string }, userId: string) {
  // Update the grade item record with the provided fields
  const item = await prisma.gradeItem.update({
    where: { id }, // Target the specific grade item by ID
    data,          // Apply the partial update data
  })
  // Log the grade item update event to the audit trail
  await logAudit("UPDATE", "GradeItem", item.id, userId)
  // Return the updated grade item object
  return item
}

/* Permanently delete a grade item */
export async function deleteGradeItem(id: string, userId: string) {
  // Delete the grade item record from the database
  await prisma.gradeItem.delete({ where: { id } })
  // Log the grade item deletion event to the audit trail
  await logAudit("DELETE", "GradeItem", id, userId)
}

/* Update a grade category's details */
export async function updateGradeCategory(id: string, data: { name?: string; weight?: number }, userId: string) {
  // Update the grade category record with the provided fields
  const category = await prisma.gradeCategory.update({
    where: { id }, // Target the specific category by ID
    data,          // Apply the partial update data
  })
  // Log the category update event to the audit trail
  await logAudit("UPDATE", "GradeCategory", category.id, userId)
  // Return the updated category object
  return category
}

/* Permanently delete a grade category */
export async function deleteGradeCategory(id: string, userId: string) {
  // Delete the grade category record from the database
  await prisma.gradeCategory.delete({ where: { id } })
  // Log the category deletion event to the audit trail
  await logAudit("DELETE", "GradeCategory", id, userId)
}
