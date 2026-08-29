import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, makeToken, authHeader, json, uniqueId, prisma } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Absence & Training Day Routes", () => {
  const emails: string[] = []
  let adminToken = ""
  let studentUser: Awaited<ReturnType<typeof createTestUser>>
  let studentToken = ""
  let termId = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    studentUser = await createTestUser(RoleType.STUDENT)
    emails.push(studentUser.email)
    studentToken = makeToken(studentUser.id, studentUser.role)

    // Create a term for training day tests
    const termRes = await app.request("/api/terms", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ name: `CWTS Training-${uniqueId()}`, startDate: "2026-01-15", endDate: "2026-05-15" }),
    })
    const termBody = await termRes.json()
    termId = termBody.data?.id ?? ""
  })

  afterAll(async () => {
    if (termId) await prisma.academicTerm.deleteMany({ where: { id: termId } })
    await cleanupTestUsers(emails)
  })

  it("POST /api/absences/check — triggers bulk absence check (admin)", async () => {
    const res = await app.request("/api/absences/check", {
      method: "POST",
      headers: authHeader(adminToken),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  }, 60000)

  it("POST /api/absences/check — 403 for student", async () => {
    const res = await app.request("/api/absences/check", {
      method: "POST",
      headers: authHeader(studentToken),
    })
    expect(res.status).toBe(403)
  })

  it("GET /api/absences/count/:userId — returns absence count", async () => {
    const res = await app.request(`/api/absences/count/${studentUser.id}`, {
      headers: authHeader(adminToken),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeDefined()
  })

  it("GET /api/training/summary — returns training summary", async () => {
    const res = await app.request(`/api/training/summary?termId=${termId}`, { headers: authHeader(adminToken) })
    expect(res.status).toBe(200)
  })

  it("GET /api/training/student/:userId — returns student training days", async () => {
    const res = await app.request(`/api/training/student/${studentUser.id}?termId=${termId}`, {
      headers: authHeader(adminToken),
    })
    expect(res.status).toBe(200)
  })

  it("GET /api/training/overview — returns overview", async () => {
    const res = await app.request(`/api/training/overview?termId=${termId}`, { headers: authHeader(adminToken) })
    expect(res.status).toBe(200)
  })
})
