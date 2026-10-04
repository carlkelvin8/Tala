import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, makeToken, authHeader } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Calendar Feed", () => {
  const emails: string[] = []
  let adminToken = ""
  let studentToken = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    const stud = await createTestUser(RoleType.STUDENT)
    emails.push(stud.email)
    studentToken = makeToken(stud.id, stud.role)
  })

  afterAll(async () => {
    await cleanupTestUsers(emails)
  })

  it("GET /api/calendar — returns sessions, exams, and announcements in one payload", async () => {
    const res = await app.request("/api/calendar?from=2026-01-01T00:00:00.000Z&to=2026-12-31T00:00:00.000Z", {
      headers: authHeader(adminToken),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.sessions).toBeInstanceOf(Array)
    expect(body.data.exams).toBeInstanceOf(Array)
    expect(body.data.announcements).toBeInstanceOf(Array)
  })

  it("GET /api/calendar — works for students with section visibility", async () => {
    const res = await app.request("/api/calendar?from=2026-01-01T00:00:00.000Z&to=2026-12-31T00:00:00.000Z", {
      headers: authHeader(studentToken),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.sessions).toBeInstanceOf(Array)
    expect(body.data.exams).toBeInstanceOf(Array)
    expect(body.data.announcements).toBeInstanceOf(Array)
  })

  it("GET /api/calendar — 401 without auth", async () => {
    const res = await app.request("/api/calendar")
    expect(res.status).toBe(401)
  })
})
