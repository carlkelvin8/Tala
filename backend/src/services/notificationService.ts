import { NotificationType, NstpType } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { programUserScope } from "./programScope.js"

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
    },
  })
}

export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string
) {
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      title,
      message,
    })),
  })
}

export async function getUserNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && { isRead: false }),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
}

export async function markAsRead(id: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification) {
    throw new Error("Notification not found")
  }
  if (notification.userId !== userId) {
    throw new Error("Unauthorized")
  }

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  })
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  })
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  })
}

/* Fire-and-forget GENERAL notification: a failure to notify must never fail the action that triggered it. */
export async function notifySafe(userIds: string | string[], title: string, message: string) {
  const ids = Array.isArray(userIds) ? userIds : [userIds]
  if (ids.length === 0) return
  try {
    await createBulkNotifications(ids, "GENERAL", title, message)
  } catch (error) {
    console.error("Failed to create notification:", error instanceof Error ? error.message : error)
  }
}

/* Everyone an announcement/material is relevant to: active students, cadet officers and
   instructors/implementors, limited to one NSTP program when given (null = everyone).
   Cadet officers rarely carry an account-level program, so they also match through their
   approved enrollment's section. An implementor without a program counts as CWTS. */
export async function activeAudienceIds(program?: NstpType | null, excludeUserId?: string | null) {
  const programMatch = program
    ? {
        OR: [
          { program },
          { studentProfile: { section: { course: { nstpType: program } } } },
          { role: "CADET_OFFICER" as const, enrollments: { some: { status: "APPROVED" as const, section: { course: { nstpType: program } } } } },
          ...(program === "CWTS" ? [{ role: "IMPLEMENTOR" as const, program: null }] : []),
        ],
      }
    : {}
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["STUDENT", "CADET_OFFICER", "IMPLEMENTOR"] },
      isActive: true,
      deletedAt: null,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      ...programMatch,
    },
    select: { id: true },
  })
  return users.map((user) => user.id)
}

/* Notify the people an item is aimed at: one section's students and cadet officers, or a
   program's whole audience (everyone when neither is set). The audience lookup is inside the
   guard too, so it can never fail the caller. The author is never notified about their own post. */
export async function notifyStudentsSafe(
  audience: { sectionId?: string | null; program?: NstpType | null; excludeUserId?: string | null },
  title: string,
  message: string
) {
  try {
    let ids: string[]
    if (audience.sectionId) {
      const [students, cadets] = await Promise.all([
        prisma.studentProfile.findMany({
          where: { sectionId: audience.sectionId, user: { isActive: true, deletedAt: null } },
          select: { userId: true },
        }),
        prisma.enrollment.findMany({
          where: { sectionId: audience.sectionId, status: "APPROVED", user: { role: "CADET_OFFICER", isActive: true, deletedAt: null } },
          select: { userId: true },
        }),
      ])
      ids = [...new Set([...students, ...cadets].map((row) => row.userId))]
    } else {
      ids = await activeAudienceIds(audience.program)
    }
    if (audience.excludeUserId) ids = ids.filter((id) => id !== audience.excludeUserId)
    await notifySafe(ids, title, message)
  } catch (error) {
    console.error("Failed to notify students:", error instanceof Error ? error.message : error)
  }
}

/* Notify staff: every active admin, plus instructors/implementors of the given program
   (an implementor without a program counts as CWTS, matching how accounts are scoped). */
export async function notifyStaffSafe(program: NstpType | null | undefined, title: string, message: string) {
  try {
    const staff = await prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { role: "ADMIN" },
          ...(program
            ? [{ role: "IMPLEMENTOR" as const, OR: [{ program }, ...(program === "CWTS" ? [{ program: null }] : [])] }]
            : []),
        ],
      },
      select: { id: true },
    })
    await notifySafe(staff.map((user) => user.id), title, message)
  } catch (error) {
    console.error("Failed to notify staff:", error instanceof Error ? error.message : error)
  }
}
