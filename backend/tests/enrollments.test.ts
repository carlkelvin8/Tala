import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestEnrollments, cleanupTestCourses, makeToken, authHeader, json, uniqueId, prisma } from "./setup.js"
import { RoleType, NstpType } from "@prisma/client"

describe("Enrollment Routes", () => {
  const emails: string[] = []
  const enrollmentIds: string[] = []
  const courseCodes: string[] = []
  let adminToken = ""
  let studentUser: Awaited<ReturnType<typeof createTestUser>>
  let studentToken = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    studentUser = await createTestUser(RoleType.STUDENT)
    emails.push(studentUser.email)
    studentToken = makeToken(studentUser.id, studentUser.role)

    // Delete the auto-created enrollment from registration
    await prisma.enrollment.deleteMany({ where: { userId: studentUser.id } })
  })

  afterAll(async () => {
    await cleanupTestEnrollments(enrollmentIds)
    await cleanupTestCourses(courseCodes)
    await cleanupTestUsers(emails)
  })

  it("POST /api/enrollments — creates an enrollment", async () => {
    const res = await app.request("/api/enrollments", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ userId: studentUser.id }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe("PENDING")
    enrollmentIds.push(body.data.id)
  })

  it("POST /api/enrollments — rejects duplicate active enrollment", async () => {
    const res = await app.request("/api/enrollments", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ userId: studentUser.id }),
    })
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it("GET /api/enrollments — lists enrollments", async () => {
    const res = await app.request("/api/enrollments", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("PATCH /api/enrollments/:id/status — approves enrollment", async () => {
    const id = enrollmentIds[0]
    const res = await app.request(`/api/enrollments/${id}/status`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ status: "APPROVED" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.status).toBe("APPROVED")
  })

  it("POST /api/enrollments — 403 for student", async () => {
    const other = await createTestUser(RoleType.STUDENT)
    emails.push(other.email)
    // Delete auto enrollment
    await prisma.enrollment.deleteMany({ where: { userId: other.id } })
    const res = await app.request("/api/enrollments", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ userId: other.id }),
    })
    expect(res.status).toBe(403)
  })

  it("GET /api/enrollments — filters by status", async () => {
    const res = await app.request("/api/enrollments?status=APPROVED", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("POST /api/enrollments — rejects a CWTS student enrolling into an ROTC section", async () => {
    const course = await prisma.course.create({
      data: { code: `ROTCC_${uniqueId()}`, name: "Test ROTC Course", nstpType: NstpType.ROTC }
    })
    courseCodes.push(course.code)
    const section = await prisma.section.create({
      data: { code: `SEC_${uniqueId()}`, name: "ROTC Section", courseId: course.id }
    })
    const student = await createTestUser(RoleType.STUDENT)
    emails.push(student.email)
    await prisma.user.update({ where: { id: student.id }, data: { program: NstpType.CWTS } })

    const res = await app.request("/api/enrollments", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ userId: student.id, sectionId: section.id }),
    })
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.message).toContain("Program transfers are not allowed")
  })

  it("PATCH status — rejects approving an enrollment whose section program mismatches the student's program", async () => {
    const course = await prisma.course.create({
      data: { code: `CWTSC_${uniqueId()}`, name: "Test CWTS Course", nstpType: NstpType.CWTS }
    })
    courseCodes.push(course.code)
    const section = await prisma.section.create({
      data: { code: `SEC_${uniqueId()}`, name: "CWTS Section", courseId: course.id }
    })
    const student = await createTestUser(RoleType.STUDENT)
    emails.push(student.email)
    await prisma.user.update({ where: { id: student.id }, data: { program: NstpType.ROTC } })
    // Insert the mismatched enrollment directly to simulate legacy data bypassing the create guard
    const enrollment = await prisma.enrollment.create({
      data: { userId: student.id, sectionId: section.id }
    })
    enrollmentIds.push(enrollment.id)

    const res = await app.request(`/api/enrollments/${enrollment.id}/status`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ status: "APPROVED" }),
    })
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.message).toContain("Program transfers are not allowed")
  })
})
