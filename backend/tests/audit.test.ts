import { afterAll, describe, expect, it } from "vitest"
import { RoleType } from "@prisma/client"
import { app } from "../src/app.js"
import { logAudit } from "../src/services/auditService.js"
import { authHeader, cleanupTestUsers, createTestUser, makeToken, prisma, uniqueId } from "./setup.js"

describe("Audit log routes", () => {
  const emails: string[] = []
  const auditIds: string[] = []

  afterAll(async () => {
    if (auditIds.length) await prisma.auditLog.deleteMany({ where: { id: { in: auditIds } } })
    await cleanupTestUsers(emails)
  })

  it("allows admins to search audit events", async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    const marker = `E2E_${uniqueId()}`
    await logAudit("TEST", marker, undefined, admin.id)
    const created = await prisma.auditLog.findFirstOrThrow({ where: { actorId: admin.id, entity: marker } })
    auditIds.push(created.id)

    const response = await app.request(`/api/audit-logs?search=${encodeURIComponent(marker)}`, {
      headers: authHeader(makeToken(admin.id, admin.role)),
    })
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].actor.email).toBe(admin.email)
  })

  it("rejects non-admin users", async () => {
    const student = await createTestUser(RoleType.STUDENT)
    emails.push(student.email)
    const response = await app.request("/api/audit-logs", {
      headers: authHeader(makeToken(student.id, student.role)),
    })
    expect(response.status).toBe(403)
  })
})
