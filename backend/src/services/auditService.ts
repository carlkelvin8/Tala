import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

export async function logAudit(action: string, entity: string, entityId?: string, actorId?: string, meta?: Prisma.InputJsonValue) {
  await prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      actorId,
      meta
    }
  })
}
