// Import the Prisma namespace for the InputJsonValue type used in the meta field
import { Prisma } from "@prisma/client"
// Import the Prisma client for database access
import { prisma } from "../lib/prisma.js"

/* Create an audit log entry recording a significant action in the system */
export async function logAudit(
  action: string,                    // The type of action performed (e.g. "CREATE", "UPDATE", "DELETE", "LOGIN")
  entity: string,                    // The name of the entity/model affected (e.g. "User", "Enrollment")
  entityId?: string,                 // Optional UUID of the specific record that was affected
  actorId?: string,                  // Optional UUID of the user who performed the action
  meta?: Prisma.InputJsonValue       // Optional additional metadata (e.g. changed fields, context)
) {
  // Insert a new audit log record into the database
  await prisma.auditLog.create({
    data: {
      action,   // The action type string
      entity,   // The entity/model name string
      entityId, // The affected record's ID (may be undefined)
      actorId,  // The acting user's ID (may be undefined for system actions)
      meta      // Optional JSON metadata (may be undefined)
    }
  })
}
