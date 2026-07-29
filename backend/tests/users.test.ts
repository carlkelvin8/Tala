import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, makeToken, authHeader, json, uniqueId } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("User Routes", () => {
  const emails: string[] = []
  let adminToken = ""
  let implementorToken = ""
  let studentToken = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    const impl = await createTestUser(RoleType.IMPLEMENTOR)
    emails.push(impl.email)
    implementorToken = makeToken(impl.id, impl.role)

    const stud = await createTestUser(RoleType.STUDENT)
    emails.push(stud.email)
    studentToken = makeToken(stud.id, stud.role)
  })

  afterAll(async () => {
    await cleanupTestUsers(emails)
  })

  it("GET /api/users — lists users (admin only)", async () => {
    const res = await app.request("/api/users", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toBeInstanceOf(Array)
    expect(body.meta).toBeDefined()
  })

  it("GET /api/users — 403 for implementor", async () => {
    const res = await app.request("/api/users", { headers: authHeader(implementorToken) })
    expect(res.status).toBe(403)
  })

  it("GET /api/users — 403 for student", async () => {
    const res = await app.request("/api/users", { headers: authHeader(studentToken) })
    expect(res.status).toBe(403)
  })

  it("POST /api/users — creates a user (admin)", async () => {
    const email = `${uniqueId()}@test.com`
    emails.push(email)
    const res = await app.request("/api/users", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ email, password: "password123", role: "STUDENT", firstName: "New", lastName: "Student" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.email).toBe(email)
  })

  it("POST /api/users — 403 for implementor", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: authHeader(implementorToken),
      body: json({ email: `${uniqueId()}@test.com`, password: "password123", role: "STUDENT", firstName: "A", lastName: "B" }),
    })
    expect(res.status).toBe(403)
  })

  it("PATCH /api/users/:id — updates user (admin)", async () => {
    const user = await createTestUser(RoleType.STUDENT)
    emails.push(user.email)
    const res = await app.request(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ role: "CADET_OFFICER" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it("GET /api/users/:id — gets user by id", async () => {
    const user = await createTestUser(RoleType.STUDENT)
    emails.push(user.email)
    const res = await app.request(`/api/users/${user.id}`, {
      headers: authHeader(adminToken),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.id).toBe(user.id)
  })
})
