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
      body: json({ email, password: "password123", role: "STUDENT", firstName: "Juan", lastName: "Dela Cruz", studentNo: `sno_${uniqueId()}` }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.email).toBe(email)
    userId = body.data.id
  })

  it("POST /api/auth/register — rejects duplicate email", async () => {
    const email = `${uniqueId()}@test.com`
    emails.push(email)
    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email, password: "password123", role: "STUDENT", firstName: "A", lastName: "B" }),
    })
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email, password: "password123", role: "STUDENT", firstName: "A", lastName: "B" }),
    })
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it("POST /api/auth/register — validation error for bad email", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email: "not-an-email", password: "password123", role: "STUDENT", firstName: "A", lastName: "B" }),
    })
    expect(res.status).toBe(422)
  })

  it("POST /api/auth/login — logs in with valid credentials", async () => {
    const email = `${uniqueId()}@test.com`
    emails.push(email)
    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json({ email, password: "password123", role: "ADMIN", firstName: "Admin", lastName: "User" }),
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
      body: json({ email, password: "password123", role: "ADMIN", firstName: "PW", lastName: "Test" }),
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
      body: json({ email, password: "password123", role: "ADMIN", firstName: "R", lastName: "T" }),
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
  })
})
