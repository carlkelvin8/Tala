import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestEnrollments, makeToken, authHeader, json, uniqueId, prisma } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Enrollment Routes", () => {
  const emails: string[] = []
  const enrollmentIds: string[] = []
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
})
