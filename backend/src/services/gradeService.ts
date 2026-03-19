// Import the Prisma client for database access
import { prisma } from "../lib/prisma.js"
// Import the audit logging helper to record grade management events
import { logAudit } from "./auditService.js"

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
export async function encodeStudentGrade(studentId: string, gradeItemId: string, score: number, encodedById: string) {
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
export async function listGrades(filters: { studentId?: string }, skip: number, take: number) {
  // Build the Prisma where clause dynamically based on provided filters
  const where: Record<string, unknown> = {}
  // Add student ID filter if provided
  if (filters.studentId) where.studentId = filters.studentId
  // Run the count and data queries in parallel for performance
  const [items, total] = await Promise.all([
    // Fetch the paginated student grade records with related data
    prisma.studentGrade.findMany({
      where,  // Apply the dynamic filter
      skip,   // Skip records for previous pages
      take,   // Limit to the page size
      include: {
        student: {
          select: {
            id: true,    // Student's user ID
            email: true, // Student's email address
            studentProfile: {
              select: {
                firstName: true, // Student's first name
                lastName: true   // Student's last name
              }
            }
          }
        },
        gradeItem: { include: { category: true } } // Include the grade item and its parent category
      },
      orderBy: { createdAt: "desc" } // Most recently created grades first
    }),
    // Count the total number of matching grade records for pagination metadata
    prisma.studentGrade.count({ where })
  ])
  // Return both the page of items and the total count
  return { items, total }
}

/* Update a student's score for a grade record */
export async function updateGrade(id: string, score: number, userId: string) {
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
export async function deleteGrade(id: string, userId: string) {
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
