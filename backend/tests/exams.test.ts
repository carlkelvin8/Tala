import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestExamSessions, makeToken, authHeader, json, uniqueId, prisma } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Exam Routes", () => {
  const emails: string[] = []
  const sessionIds: string[] = []
  const questionIds: string[] = []
  let adminToken = ""
  let implementorToken = ""
  let studentUser: Awaited<ReturnType<typeof createTestUser>>
  let studentToken = ""
  let sessionId = ""
  let attemptId = ""
  let identificationId = ""
  let mcqId = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    const implementor = await createTestUser(RoleType.IMPLEMENTOR)
    emails.push(implementor.email)
    implementorToken = makeToken(implementor.id, implementor.role)

    studentUser = await createTestUser(RoleType.STUDENT)
    emails.push(studentUser.email)
    studentToken = makeToken(studentUser.id, studentUser.role)
  })

  afterAll(async () => {
    if (questionIds.length > 0) {
      await prisma.examQuestion.deleteMany({ where: { id: { in: questionIds } } })
    }
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
        // Scheduled 35 minutes back so the 60-minute take-window is still open
        scheduledAt: new Date(Date.now() - 35 * 60000).toISOString(),
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

  it("PATCH /api/exams/:id/status — opens the session for taking (admin)", async () => {
    const res = await app.request(`/api/exams/${sessionId}/status`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ status: "ACTIVE" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.status).toBe("ACTIVE")
  })

  it("POST /api/exams/attempts — 403 for non-student", async () => {
    const res = await app.request("/api/exams/attempts", {
      method: "POST",
      headers: authHeader(implementorToken),
      body: json({ examSessionId: sessionId }),
    })
    expect(res.status).toBe(403)
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

  it("POST /api/exams/attempts — rejects a second attempt (single-attempt rule)", async () => {
    const res = await app.request("/api/exams/attempts", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ examSessionId: sessionId }),
    })
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.message).toMatch(/already attempted/)
  })

  it("POST /api/exams/logs — logs a monitoring event during an active attempt", async () => {
    const res = await app.request("/api/exams/logs", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ examAttemptId: attemptId, event: "tab switch detected" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.event).toBe("tab switch detected")
  })

  it("POST /api/exams/logs — rejects logging to another student's attempt", async () => {
    const res = await app.request("/api/exams/logs", {
      method: "POST",
      headers: authHeader(implementorToken),
      body: json({ examAttemptId: attemptId, event: "sabotage" }),
    })
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.message).toMatch(/Forbidden|another student|Unauthorized/i)
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

  it("POST /api/exams/:id/questions — creates an identification question (implementor)", async () => {
    const res = await app.request(`/api/exams/${sessionId}/questions`, {
      method: "POST",
      headers: authHeader(implementorToken),
      body: json({
        type: "IDENTIFICATION",
        question: "What is the capital of the Philippines?",
        correctAnswer: "Manila",
        points: 2,
      }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.type).toBe("IDENTIFICATION")
    expect(body.data.correctAnswer).toBe("Manila")
    identificationId = body.data.id
    questionIds.push(identificationId)
  })

  it("POST /api/exams/:id/questions — creates a multiple choice question (implementor)", async () => {
    const res = await app.request(`/api/exams/${sessionId}/questions`, {
      method: "POST",
      headers: authHeader(implementorToken),
      body: json({
        type: "MULTIPLE_CHOICE",
        question: "Which unit is the ROTC under?",
        options: ["AFPNORCOM", "DepEd", "DOH", "DSWD"],
        correctAnswer: "AFPNORCOM",
      }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.type).toBe("MULTIPLE_CHOICE")
    expect(body.data.options).toHaveLength(4)
    mcqId = body.data.id
    questionIds.push(mcqId)
  })

  it("POST /api/exams/:id/questions — 403 for student", async () => {
    const res = await app.request(`/api/exams/${sessionId}/questions`, {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ type: "IDENTIFICATION", question: "x?", correctAnswer: "y" }),
    })
    expect(res.status).toBe(403)
  })

  it("POST /api/exams/:id/questions — rejects multiple choice with fewer than 2 options", async () => {
    const res = await app.request(`/api/exams/${sessionId}/questions`, {
      method: "POST",
      headers: authHeader(implementorToken),
      body: json({ type: "MULTIPLE_CHOICE", question: "Q?", options: ["only"], correctAnswer: "only" }),
    })
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.message).toMatch(/at least 2 options/)
  })

  it("POST /api/exams/:id/questions — validation: missing question text", async () => {
    const res = await app.request(`/api/exams/${sessionId}/questions`, {
      method: "POST",
      headers: authHeader(implementorToken),
      body: json({ type: "IDENTIFICATION", correctAnswer: "y" }),
    })
    expect(res.status).toBe(422)
  })

  it("GET /api/exams/:id/questions — lists questions for the session", async () => {
    const res = await app.request(`/api/exams/${sessionId}/questions`, {
      headers: authHeader(implementorToken),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.map((q: any) => q.id)).toContain(identificationId)
    expect(body.data.map((q: any) => q.id)).toContain(mcqId)
  })

  it("GET /api/exams/:id/questions — 403 for student (answer keys are staff-only)", async () => {
    const res = await app.request(`/api/exams/${sessionId}/questions`, {
      headers: authHeader(studentToken),
    })
    expect(res.status).toBe(403)
  })

  it("GET /api/exams — includes question counts (admin, program-agnostic)", async () => {
    const res = await app.request("/api/exams", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    const created = body.data.find((s: any) => s.id === sessionId)
    expect(created._count.questions).toBe(2)
  })

  it("PATCH /api/exams/questions/:questionId — updates an identification question (admin)", async () => {
    const res = await app.request(`/api/exams/questions/${identificationId}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ points: 5, correctAnswer: "Manila (Capital City)" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.points).toBe(5)
    expect(body.data.correctAnswer).toBe("Manila (Capital City)")
  })

  it("DELETE /api/exams/questions/:questionId — removes a question (implementor)", async () => {
    const res = await app.request(`/api/exams/questions/${mcqId}`, {
      method: "DELETE",
      headers: authHeader(implementorToken),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })
})
