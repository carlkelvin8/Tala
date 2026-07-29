import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestMerits, makeToken, authHeader, json, uniqueId } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Merit Routes", () => {
  const emails: string[] = []
  const meritIds: string[] = []
  let adminToken = ""
  let studentUser: Awaited<ReturnType<typeof createTestUser>>
  let studentToken = ""
  let meritId = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    studentUser = await createTestUser(RoleType.STUDENT)
    emails.push(studentUser.email)
    studentToken = makeToken(studentUser.id, studentUser.role)
  })

  afterAll(async () => {
    await cleanupTestMerits(meritIds)
    await cleanupTestUsers(emails)
  })

  it("POST /api/merits — assigns a merit (admin)", async () => {
    const res = await app.request("/api/merits", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ studentId: studentUser.id, type: "MERIT", points: 5, reason: "Good conduct" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.type).toBe("MERIT")
    expect(body.data.points).toBe(5)
    meritId = body.data.id
    meritIds.push(meritId)
  })

  it("POST /api/merits — assigns a demerit", async () => {
    const res = await app.request("/api/merits", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ studentId: studentUser.id, type: "DEMERIT", points: 2, reason: "Late" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.type).toBe("DEMERIT")
    meritIds.push(body.data.id)
  })

  it("POST /api/merits — 403 for student", async () => {
    const other = await createTestUser(RoleType.STUDENT)
    emails.push(other.email)
    const res = await app.request("/api/merits", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ studentId: other.id, type: "MERIT", points: 1, reason: "Fail" }),
    })
    expect(res.status).toBe(403)
  })

  it("POST /api/merits — validation: negative points rejected", async () => {
    const res = await app.request("/api/merits", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ studentId: studentUser.id, type: "MERIT", points: -5, reason: "Bad" }),
    })
    expect(res.status).toBe(422)
  })

  it("GET /api/merits — lists merits", async () => {
    const res = await app.request("/api/merits", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("GET /api/merits — filters by studentId", async () => {
    const res = await app.request(`/api/merits?studentId=${studentUser.id}`, { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("GET /api/merits — filters by type", async () => {
    const res = await app.request("/api/merits?type=MERIT", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
  })

  it("PATCH /api/merits/:id — updates merit", async () => {
    const res = await app.request(`/api/merits/${meritId}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ points: 10, reason: "Updated reason" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.points).toBe(10)
    expect(body.data.reason).toBe("Updated reason")
  })

  it("DELETE /api/merits/:id — deletes merit (admin only)", async () => {
    const res = await app.request(`/api/merits/${meritId}`, {
      method: "DELETE",
      headers: authHeader(adminToken),
    })
    expect(res.status).toBe(200)
  })

  it("DELETE /api/merits/:id — 403 for implementor", async () => {
    const impl = await createTestUser(RoleType.IMPLEMENTOR)
    emails.push(impl.email)
    const implToken = makeToken(impl.id, impl.role)

    const createRes = await app.request("/api/merits", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ studentId: studentUser.id, type: "MERIT", points: 1, reason: "Test" }),
    })
    const createBody = await createRes.json()
    meritIds.push(createBody.data.id)

    const res = await app.request(`/api/merits/${createBody.data.id}`, {
      method: "DELETE",
      headers: authHeader(implToken),
    })
    expect(res.status).toBe(403)
  })
})
