import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestTerms, makeToken, authHeader, json, uniqueId } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Term Routes", () => {
  const emails: string[] = []
  const termNames: string[] = []
  let adminToken = ""
  let studentToken = ""
  let termId = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    const stud = await createTestUser(RoleType.STUDENT)
    emails.push(stud.email)
    studentToken = makeToken(stud.id, stud.role)
  })

  afterAll(async () => {
    await cleanupTestTerms(termNames)
    await cleanupTestUsers(emails)
  })

  it("POST /api/terms — creates a term (admin)", async () => {
    const name = `Term-${uniqueId()}`
    termNames.push(name)
    const res = await app.request("/api/terms", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ name, startDate: "2026-01-15", endDate: "2026-05-15" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.name).toBe(name)
    termId = body.data.id
  })

  it("POST /api/terms — 403 for student", async () => {
    const res = await app.request("/api/terms", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ name: "Fail", startDate: "2026-01-15", endDate: "2026-05-15" }),
    })
    expect(res.status).toBe(403)
  })

  it("POST /api/terms — rejects end <= start", async () => {
    const res = await app.request("/api/terms", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ name: "Bad", startDate: "2026-05-15", endDate: "2026-01-15" }),
    })
    expect(res.status).toBe(422)
  })

  it("GET /api/terms — lists terms", async () => {
    const res = await app.request("/api/terms", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("GET /api/terms/active — gets active term", async () => {
    const res = await app.request("/api/terms/active", { headers: authHeader(adminToken) })
    expect(res.status).toBe(200)
  })

  it("PATCH /api/terms/:id — updates term", async () => {
    const res = await app.request(`/api/terms/${termId}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ name: `Updated-${uniqueId()}` }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it("DELETE /api/terms/:id — deletes term (admin only)", async () => {
    const name = `DEL-${uniqueId()}`
    const createRes = await app.request("/api/terms", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ name, startDate: "2026-01-15", endDate: "2026-05-15" }),
    })
    const createBody = await createRes.json()
    const delId = createBody.data.id

    const res = await app.request(`/api/terms/${delId}`, {
      method: "DELETE",
      headers: authHeader(adminToken),
    })
    expect(res.status).toBe(200)
  })

  it("DELETE /api/terms/:id — 403 for implementor", async () => {
    const impl = await createTestUser(RoleType.IMPLEMENTOR)
    emails.push(impl.email)
    const implToken = makeToken(impl.id, impl.role)
    const res = await app.request(`/api/terms/${termId}`, {
      method: "DELETE",
      headers: authHeader(implToken),
    })
    expect(res.status).toBe(403)
  })
})
