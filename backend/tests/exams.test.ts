import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestExamSessions, makeToken, authHeader, json, uniqueId } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Exam Routes", () => {
  const emails: string[] = []
  const sessionIds: string[] = []
  let adminToken = ""
  let studentUser: Awaited<ReturnType<typeof createTestUser>>
  let studentToken = ""
  let sessionId = ""
  let attemptId = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    studentUser = await createTestUser(RoleType.STUDENT)
    emails.push(studentUser.email)
    studentToken = makeToken(studentUser.id, studentUser.role)
  })

  afterAll(async () => {
    await cleanupTestExamSessions(sessionIds)
    await cleanupTestUsers(emails)
  })

  it("POST /api/exams — creates exam session (admin)", async () => {
    const res = await app.request("/api/exams", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({
        title: `Exam-${uniqueId()}`,
        description: "Test exam",
        durationMin: 60,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.title).toBeDefined()
    sessionId = body.data.id
    sessionIds.push(sessionId)
  })

  it("POST /api/exams — 403 for student", async () => {
    const res = await app.request("/api/exams", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ title: "Fail", durationMin: 30, scheduledAt: new Date().toISOString() }),
    })
    expect(res.status).toBe(403)
  })

  it("POST /api/exams — validation: missing title", async () => {
    const res = await app.request("/api/exams", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ durationMin: 30, scheduledAt: new Date().toISOString() }),
    })
    expect(res.status).toBe(422)
  })

  it("GET /api/exams — lists exam sessions", async () => {
    const res = await app.request("/api/exams", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("POST /api/exams/attempts — starts an attempt (student)", async () => {
    const res = await app.request("/api/exams/attempts", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ examSessionId: sessionId }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.startedAt).toBeDefined()
    attemptId = body.data.id
  })

  it("POST /api/exams/attempts/:id/finish — ends the attempt", async () => {
    const res = await app.request(`/api/exams/attempts/${attemptId}/finish`, {
      method: "POST",
      headers: authHeader(studentToken),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.endedAt).toBeDefined()
  })

  it("POST /api/exams/attempts/:id/finish — rejects already submitted attempt", async () => {
    const res = await app.request(`/api/exams/attempts/${attemptId}/finish`, {
      method: "POST",
      headers: authHeader(studentToken),
    })
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it("POST /api/exams/logs — logs a monitoring event", async () => {
    const res = await app.request("/api/exams/logs", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ examAttemptId: attemptId, event: "tab switch detected" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.event).toBe("tab switch detected")
  })
})
