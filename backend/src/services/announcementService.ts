import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"
import { NstpType } from "@prisma/client"

/* Create a new announcement. Optionally scoped to the caller's program so
   implementors cannot publish announcements outside their own program. */
export async function createAnnouncement(data: {
  title: string
  body: string
  program?: NstpType | null
  createdById: string
  scopeProgram?: NstpType | null
}) {
  const program = data.scopeProgram ?? data.program ?? null
  const announcement = await prisma.announcement.create({
    data: { title: data.title, body: data.body, program, createdById: data.createdById },
  })
  await logAudit("CREATE", "Announcement", announcement.id, data.createdById)
  return announcement
}

/* Return a paginated list of announcements. Unauthenticated listing is not
   supported; callers pass an optional scopeProgram to keep implementors inside
   their own program. */
export async function listAnnouncements(
  filters: { program?: NstpType },
  skip: number,
  take: number,
  scopeProgram?: NstpType | null
) {
  const where: Record<string, unknown> = {}

  // A program-scoped caller only ever sees announcements for their program
  const effectiveProgram = scopeProgram ?? filters.program
  if (effectiveProgram) {
    where.OR = [{ program: effectiveProgram }, { program: null }]
  }

  const [items, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      skip,
      take,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            studentProfile: { select: { firstName: true, lastName: true } },
            implementorProfile: { select: { firstName: true, lastName: true } },
            cadetOfficerProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.announcement.count({ where }),
  ])
  return { items, total }
}

/* Update an existing announcement. Scoped callers may only touch announcements
   that belong to (or are not restricted from) their own program. */
export async function updateAnnouncement(
  id: string,
  data: { title?: string; body?: string; program?: NstpType | null },
  userId: string,
  scopeProgram?: NstpType | null
) {
  const existing = await prisma.announcement.findUnique({ where: { id } })
  if (!existing) throw new Error("Announcement not found")
  if (scopeProgram && existing.program && existing.program !== scopeProgram) {
    throw new Error("Announcement belongs to another program")
  }
  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.body !== undefined) updateData.body = data.body
  if (data.program !== undefined) updateData.program = data.program
  const announcement = await prisma.announcement.update({ where: { id }, data: updateData })
  await logAudit("UPDATE", "Announcement", id, userId)
  return announcement
}

/* Permanently delete an announcement. */
export async function deleteAnnouncement(id: string, userId: string, scopeProgram?: NstpType | null) {
  const existing = await prisma.announcement.findUnique({ where: { id } })
  if (!existing) throw new Error("Announcement not found")
  if (scopeProgram && existing.program && existing.program !== scopeProgram) {
    throw new Error("Announcement belongs to another program")
  }
  await prisma.announcement.delete({ where: { id } })
  await logAudit("DELETE", "Announcement", id, userId)
}