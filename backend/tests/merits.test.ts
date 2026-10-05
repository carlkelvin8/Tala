import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestMerits, makeToken, authHeader, json, uniqueId, prisma } from "./setup.js"
import { NstpType, RoleType } from "@prisma/client"

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

  it("POST /api/merits — 403 for implementor", async () => {
    const impl = await createTestUser(RoleType.IMPLEMENTOR)
    emails.push(impl.email)
    const implToken = makeToken(impl.id, impl.role)

    const res = await app.request("/api/merits", {
      method: "POST",
      headers: authHeader(implToken),
      body: json({ studentId: studentUser.id, type: "MERIT", points: 5, reason: "Should be denied" }),
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

  it("GET /api/merits — blocks CWTS students and allows ROTC students", async () => {
    const cwtsStudent = await createTestUser(RoleType.STUDENT)
    emails.push(cwtsStudent.email)
    await prisma.user.update({ where: { id: cwtsStudent.id }, data: { program: NstpType.CWTS } })
    const cwtsResponse = await app.request("/api/merits", {
      headers: authHeader(makeToken(cwtsStudent.id, cwtsStudent.role)),
    })
    expect(cwtsResponse.status).toBe(403)

    const rotcStudent = await createTestUser(RoleType.STUDENT)
    emails.push(rotcStudent.email)
    await prisma.user.update({ where: { id: rotcStudent.id }, data: { program: NstpType.ROTC } })
    const rotcResponse = await app.request("/api/merits", {
      headers: authHeader(makeToken(rotcStudent.id, rotcStudent.role)),
    })
    expect(rotcResponse.status).toBe(200)
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

  describe("ROTC implementor program-scoped access", () => {
    it("POST /api/merits — ROTC implementor assigns to ROTC student, blocked for CWTS student", async () => {
      const rotcImpl = await createTestUser(RoleType.IMPLEMENTOR)
      emails.push(rotcImpl.email)
      await prisma.user.update({ where: { id: rotcImpl.id }, data: { program: NstpType.ROTC } })
      const rotcToken = makeToken(rotcImpl.id, rotcImpl.role)

      const rotcStud = await createTestUser(RoleType.STUDENT)
      emails.push(rotcStud.email)
      await prisma.user.update({ where: { id: rotcStud.id }, data: { program: NstpType.ROTC } })

      const cwtsStud = await createTestUser(RoleType.STUDENT)
      emails.push(cwtsStud.email)
      await prisma.user.update({ where: { id: cwtsStud.id }, data: { program: NstpType.CWTS } })

      const allowed = await app.request("/api/merits", {
        method: "POST",
        headers: authHeader(rotcToken),
        body: json({ studentId: rotcStud.id, type: "MERIT", points: 5, reason: "ROTC good conduct" }),
      })
      expect(allowed.status).toBe(200)
      meritIds.push((await allowed.json()).data.id)

      const blocked = await app.request("/api/merits", {
        method: "POST",
        headers: authHeader(rotcToken),
        body: json({ studentId: cwtsStud.id, type: "MERIT", points: 5, reason: "Cross-program" }),
      })
      expect(blocked.status).toBe(403)
    }, 60000)

    it("GET /api/merits — ROTC implementor sees only ROTC students, CWTS implementor blocked", async () => {
      const rotcImpl = await createTestUser(RoleType.IMPLEMENTOR)
      emails.push(rotcImpl.email)
      await prisma.user.update({ where: { id: rotcImpl.id }, data: { program: NstpType.ROTC } })
      const rotcToken = makeToken(rotcImpl.id, rotcImpl.role)

      const cwtsImpl = await createTestUser(RoleType.IMPLEMENTOR)
      emails.push(cwtsImpl.email)
      await prisma.user.update({ where: { id: cwtsImpl.id }, data: { program: NstpType.CWTS } })
      const cwtsToken = makeToken(cwtsImpl.id, cwtsImpl.role)

      const rotcStud = await createTestUser(RoleType.STUDENT)
      emails.push(rotcStud.email)
      await prisma.user.update({ where: { id: rotcStud.id }, data: { program: NstpType.ROTC } })

      const cwtsStud = await createTestUser(RoleType.STUDENT)
      emails.push(cwtsStud.email)
      await prisma.user.update({ where: { id: cwtsStud.id }, data: { program: NstpType.CWTS } })

      const rotcMerit = await app.request("/api/merits", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ studentId: rotcStud.id, type: "MERIT", points: 3, reason: "ROTC scope check" }),
      })
      meritIds.push((await rotcMerit.json()).data.id)

      const cwtsMerit = await app.request("/api/merits", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ studentId: cwtsStud.id, type: "MERIT", points: 7, reason: "CWTS scope check" }),
      })
      meritIds.push((await cwtsMerit.json()).data.id)

      const rotcList = await app.request(`/api/merits?studentId=${rotcStud.id}`, { headers: authHeader(rotcToken) })
      expect(rotcList.status).toBe(200)
      expect(((await rotcList.json()).data as unknown[]).length).toBeGreaterThan(0)

      // Querying a CWTS student is scoped out — empty, never leaked
      const crossList = await app.request(`/api/merits?studentId=${cwtsStud.id}`, { headers: authHeader(rotcToken) })
      expect(crossList.status).toBe(200)
      expect((await crossList.json()).data).toEqual([])

      const cwtsList = await app.request("/api/merits", { headers: authHeader(cwtsToken) })
      expect(cwtsList.status).toBe(403)
    }, 60000)

    it("PATCH/DELETE /api/merits/:id — ROTC implementor manages own program, blocked cross-program", async () => {
      const rotcImpl = await createTestUser(RoleType.IMPLEMENTOR)
      emails.push(rotcImpl.email)
      await prisma.user.update({ where: { id: rotcImpl.id }, data: { program: NstpType.ROTC } })
      const rotcToken = makeToken(rotcImpl.id, rotcImpl.role)

      const rotcStud = await createTestUser(RoleType.STUDENT)
      emails.push(rotcStud.email)
      await prisma.user.update({ where: { id: rotcStud.id }, data: { program: NstpType.ROTC } })

      const cwtsStud = await createTestUser(RoleType.STUDENT)
      emails.push(cwtsStud.email)
      await prisma.user.update({ where: { id: cwtsStud.id }, data: { program: NstpType.CWTS } })

      const own = (await (await app.request("/api/merits", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ studentId: rotcStud.id, type: "MERIT", points: 2, reason: "Own program" }),
      })).json()).data
      meritIds.push(own.id)

      const other = (await (await app.request("/api/merits", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ studentId: cwtsStud.id, type: "MERIT", points: 2, reason: "Other program" }),
      })).json()).data
      meritIds.push(other.id)

      const patchOwn = await app.request(`/api/merits/${own.id}`, {
        method: "PATCH",
        headers: authHeader(rotcToken),
        body: json({ points: 9 }),
      })
      expect(patchOwn.status).toBe(200)

      const patchOther = await app.request(`/api/merits/${other.id}`, {
        method: "PATCH",
        headers: authHeader(rotcToken),
        body: json({ points: 9 }),
      })
      expect(patchOther.status).toBe(403)

      const deleteOther = await app.request(`/api/merits/${other.id}`, {
        method: "DELETE",
        headers: authHeader(rotcToken),
      })
      expect(deleteOther.status).toBe(403)

      const deleteOwn = await app.request(`/api/merits/${own.id}`, {
        method: "DELETE",
        headers: authHeader(rotcToken),
      })
      expect(deleteOwn.status).toBe(200)
      meritIds.splice(meritIds.indexOf(own.id), 1)
    }, 60000)
  })
})
