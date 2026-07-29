import { prisma } from "../src/lib/prisma.js"
import { signAccessToken } from "../src/lib/jwt.js"
import { RoleType } from "@prisma/client"
import { randomUUID } from "crypto"

let uidCounter = 0
function uniqueId() {
  return `${Date.now()}_${++uidCounter}_${randomUUID().slice(0, 8)}`
}

export function makeToken(userId: string, role: RoleType) {
  return signAccessToken({ sub: userId, role })
}

export async function createTestUser(role: RoleType = RoleType.ADMIN, extra?: { email?: string }) {
  const email = extra?.email ?? `${uniqueId()}@test.com`
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: "$2a$10$abcdefghijklmnopqrstuuFGHIJKLMNOPQRSTUVWXYZ012345",
      role,
      isActive: true,
    },
  })

  if (role === RoleType.STUDENT) {
    await prisma.studentProfile.create({
      data: { userId: user.id, firstName: "Test", lastName: "Student", studentNo: uniqueId() },
    })
  } else if (role === RoleType.IMPLEMENTOR) {
    await prisma.implementorProfile.create({
      data: { userId: user.id, firstName: "Test", lastName: "Implementor" },
    })
  } else if (role === RoleType.CADET_OFFICER) {
    await prisma.cadetOfficerProfile.create({
      data: { userId: user.id, firstName: "Test", lastName: "Cadet" },
    })
  }

  return user
}

export async function cleanupTestUsers(emails: string[]) {
  if (emails.length === 0) return
  const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } })
  const ids = users.map((u) => u.id)
  if (ids.length === 0) return

  await prisma.monitoringLog.deleteMany({ where: { examAttempt: { studentId: { in: ids } } } })
  await prisma.examAttempt.deleteMany({ where: { studentId: { in: ids } } })
  await prisma.meritDemerit.deleteMany({ where: { studentId: { in: ids } } })
  await prisma.meritDemerit.deleteMany({ where: { encodedById: { in: ids } } })
  await prisma.studentGrade.deleteMany({ where: { studentId: { in: ids } } })
  await prisma.studentGrade.deleteMany({ where: { encodedById: { in: ids } } })
  await prisma.attendanceRecord.deleteMany({ where: { userId: { in: ids } } })
  await prisma.learningMaterial.deleteMany({ where: { createdById: { in: ids } } })
  await prisma.instructorRemark.deleteMany({ where: { userId: { in: ids } } })
  await prisma.instructorRemark.deleteMany({ where: { createdBy: { in: ids } } })
  await prisma.enrollment.deleteMany({ where: { userId: { in: ids } } })
  await prisma.studentProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.implementorProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.cadetOfficerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
}

export async function cleanupTestCourses(codes: string[]) {
  if (codes.length === 0) return
  const courses = await prisma.course.findMany({ where: { code: { in: codes } }, select: { id: true } })
  const ids = courses.map((c) => c.id)
  if (ids.length === 0) return
  await prisma.section.deleteMany({ where: { courseId: { in: ids } } })
  await prisma.course.deleteMany({ where: { id: { in: ids } } })
}

export async function cleanupTestSections(codes: string[]) {
  if (codes.length === 0) return
  await prisma.section.deleteMany({ where: { code: { in: codes } } })
}

export async function cleanupTestTerms(names: string[]) {
  if (names.length === 0) return
  await prisma.academicTerm.deleteMany({ where: { name: { in: names } } })
}

export async function cleanupTestEnrollments(ids: string[]) {
  if (ids.length === 0) return
  await prisma.enrollment.deleteMany({ where: { id: { in: ids } } })
}

export async function cleanupTestMaterials(ids: string[]) {
  if (ids.length === 0) return
  await prisma.learningMaterial.deleteMany({ where: { id: { in: ids } } })
}

export async function cleanupTestGradeCategories(ids: string[]) {
  if (ids.length === 0) return
  await prisma.studentGrade.deleteMany({ where: { gradeItem: { categoryId: { in: ids } } } })
  await prisma.gradeItem.deleteMany({ where: { categoryId: { in: ids } } })
  await prisma.gradeCategory.deleteMany({ where: { id: { in: ids } } })
}

export async function cleanupTestGradeItems(ids: string[]) {
  if (ids.length === 0) return
  await prisma.studentGrade.deleteMany({ where: { gradeItemId: { in: ids } } })
  await prisma.gradeItem.deleteMany({ where: { id: { in: ids } } })
}

export async function cleanupTestStudentGrades(ids: string[]) {
  if (ids.length === 0) return
  await prisma.studentGrade.deleteMany({ where: { id: { in: ids } } })
}

export async function cleanupTestMerits(ids: string[]) {
  if (ids.length === 0) return
  await prisma.meritDemerit.deleteMany({ where: { id: { in: ids } } })
}

export async function cleanupTestExamSessions(ids: string[]) {
  if (ids.length === 0) return
  await prisma.monitoringLog.deleteMany({ where: { examAttempt: { examSessionId: { in: ids } } } })
  await prisma.examAttempt.deleteMany({ where: { examSessionId: { in: ids } } })
  await prisma.examSession.deleteMany({ where: { id: { in: ids } } })
}

export async function cleanupTestFlights(codes: string[]) {
  if (codes.length === 0) return
  await prisma.flight.deleteMany({ where: { code: { in: codes } } })
}

export async function cleanupTestRemarks(ids: string[]) {
  if (ids.length === 0) return
  await prisma.instructorRemark.deleteMany({ where: { id: { in: ids } } })
}

export function json(body: unknown) {
  return JSON.stringify(body)
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

export { prisma, uniqueId }
