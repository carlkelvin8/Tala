import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, makeToken, authHeader, json, uniqueId, prisma } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Flight Routes", () => {
  const emails: string[] = []
  const flightCodes: string[] = []
  let adminToken = ""
  let studentToken = ""
  let flightId = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    const stud = await createTestUser(RoleType.STUDENT)
    emails.push(stud.email)
    studentToken = makeToken(stud.id, stud.role)
  })

  afterAll(async () => {
    if (flightCodes.length) await prisma.flight.deleteMany({ where: { code: { in: flightCodes } } })
    await cleanupTestUsers(emails)
  })

  it("POST /api/flights — creates a flight (admin)", async () => {
    const code = `FLT-${uniqueId()}`
    flightCodes.push(code)
    const res = await app.request("/api/flights", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code, name: "Alpha Flight" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.code).toBe(code)
    flightId = body.data.id
  })

  it("POST /api/flights — 403 for student", async () => {
    const res = await app.request("/api/flights", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ code: "FAIL", name: "Fail" }),
    })
    expect(res.status).toBe(403)
  })

  it("GET /api/flights — lists flights", async () => {
    const res = await app.request("/api/flights", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("PATCH /api/flights/:id — updates flight", async () => {
    const res = await app.request(`/api/flights/${flightId}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ code: flightCodes[0], name: "Updated Flight" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.name).toBe("Updated Flight")
  })

  it("DELETE /api/flights/:id — deletes flight", async () => {
    const code = `DEL-${uniqueId()}`
    const createRes = await app.request("/api/flights", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code, name: "To Delete" }),
    })
    const createBody = await createRes.json()

    const res = await app.request(`/api/flights/${createBody.data.id}`, {
      method: "DELETE",
      headers: authHeader(adminToken),
    })
    expect(res.status).toBe(200)
  })

  it("POST /api/flights — validation: short code", async () => {
    const res = await app.request("/api/flights", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code: "A", name: "Bad" }),
    })
    expect(res.status).toBe(422)
  })
})
