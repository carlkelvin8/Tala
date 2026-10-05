import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { prisma, createTestUser, cleanupTestUsers, makeToken, authHeader, json, uniqueId } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Auth Routes", () => {
  const emails: string[] = []
  let userId = ""

  afterAll(async () => {
    await cleanupTestUsers(emails)
  })

  it("POST /api/auth/register — registers a new user", async () => {
    const email = `reg_${uniqueId()}@test.com`
    emails.push(email)
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email, password: "password123", role: "STUDENT", program: "CWTS", degreeProgram: "BSAIS", firstName: "Juan", lastName: "Dela Cruz", studentNo: `sno_${uniqueId()}` }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.email).toBe(email)
    expect(body.data.role).toBe("STUDENT")
    expect(body.data.program).toBe("CWTS")
    userId = body.data.id
  })

  it("POST /api/auth/register — rejects non-STUDENT roles", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email: `admin_${uniqueId()}@test.com`, password: "password123", role: "ADMIN", program: "CWTS", degreeProgram: "BSAIS", firstName: "A", lastName: "B" }),
    })
    expect(res.status).toBe(422)
  })

  it("POST /api/auth/register — requires program", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email: `noprogram_${uniqueId()}@test.com`, password: "password123", role: "STUDENT", firstName: "A", lastName: "B" }),
    })
    expect(res.status).toBe(422)
  })

  it("POST /api/auth/register — rejects a program that does not match the degree program", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email: `mismatch_${uniqueId()}@test.com`, password: "password123", role: "STUDENT", program: "ROTC", degreeProgram: "BSAIS", firstName: "A", lastName: "B" }),
    })
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.message).toContain("CWTS")
  })

  it("GET /api/auth/degree-programs — is public and lists both components", async () => {
    const res = await app.request("/api/auth/degree-programs")
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.ROTC.length).toBeGreaterThan(0)
    expect(body.data.CWTS.length).toBeGreaterThan(0)
  })

  it("POST /api/auth/register — rejects duplicate email", async () => {
    const email = `${uniqueId()}@test.com`
    emails.push(email)
    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email, password: "password123", role: "STUDENT", program: "CWTS", degreeProgram: "BSAIS", firstName: "A", lastName: "B" }),
    })
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email, password: "password123", role: "STUDENT", program: "CWTS", degreeProgram: "BSAIS", firstName: "A", lastName: "B" }),
    })
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it("POST /api/auth/register — validation error for bad email", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email: "not-an-email", password: "password123", role: "STUDENT", program: "CWTS", degreeProgram: "BSAIS", firstName: "A", lastName: "B" }),
    })
    expect(res.status).toBe(422)
  })

  it("POST /api/auth/login — logs in with valid credentials", async () => {
    const email = `${uniqueId()}@test.com`
    emails.push(email)
    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email, password: "password123", role: "STUDENT", program: "CWTS", degreeProgram: "BSAIS", firstName: "Admin", lastName: "User" }),
    })
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email, password: "password123" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.accessToken).toBeDefined()
    expect(body.data.refreshToken).toBeDefined()
  })

  it("POST /api/auth/login — rejects invalid credentials", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email: "nonexistent@test.com", password: "wrongpassword" }),
    })
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it("GET /api/auth/profile — returns user profile with valid token", async () => {
    const user = await createTestUser(RoleType.ADMIN)
    emails.push(user.email)
    const token = makeToken(user.id, user.role)
    const res = await app.request("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.id).toBe(user.id)
  })

  it("GET /api/auth/profile — returns 401 without token", async () => {
    const res = await app.request("/api/auth/profile")
    expect(res.status).toBe(401)
  })

  it("PATCH /api/auth/profile — updates profile", async () => {
    const user = await createTestUser(RoleType.STUDENT)
    emails.push(user.email)
    const token = makeToken(user.id, user.role)
    const res = await app.request("/api/auth/profile", {
      method: "PATCH",
      headers: authHeader(token),
      body: json({ firstName: "Updated", lastName: "Name" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it("POST /api/auth/change-password — changes password", async () => {
    const email = `${uniqueId()}@test.com`
    emails.push(email)
    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email, password: "password123", role: "STUDENT", program: "ROTC", degreeProgram: "BSAT", firstName: "PW", lastName: "Test" }),
    })
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email, password: "password123" }),
    })
    const loginBody = await loginRes.json()
    const token = loginBody.data.accessToken

    const res = await app.request("/api/auth/change-password", {
      method: "POST",
      headers: authHeader(token),
      body: json({ currentPassword: "password123", newPassword: "newpassword456" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it("POST /api/auth/refresh — refreshes tokens", async () => {
    const email = `${uniqueId()}@test.com`
    emails.push(email)
    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email, password: "password123", role: "STUDENT", program: "CWTS", degreeProgram: "BSAIS", firstName: "R", lastName: "T" }),
    })
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email, password: "password123" }),
    })
    const loginBody = await loginRes.json()
    const refreshToken = loginBody.data.refreshToken

    const res = await app.request("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ refreshToken }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.accessToken).toBeDefined()

    const replay = await app.request("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ refreshToken }),
    })
    expect(replay.status).toBe(401)

    const logout = await app.request("/api/auth/logout", {
      method: "POST",
      headers: authHeader(body.data.accessToken),
    })
    expect(logout.status).toBe(200)

    const afterLogout = await app.request("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ refreshToken: body.data.refreshToken }),
    })
    expect(afterLogout.status).toBe(401)
  })
})
