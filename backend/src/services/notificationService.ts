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

/* Active student accounts, optionally limited to one NSTP program (null/undefined = everyone). */
export async function activeStudentIds(program?: NstpType | null) {
  const scope = programUserScope(program)
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isActive: true, deletedAt: null, ...(scope ? scope : {}) },
    select: { id: true },
  })
  return students.map((student) => student.id)
}

/* Notify the students an item is aimed at: one section, or a program (or everyone when neither is set).
   The audience lookup is inside the guard too, so it can never fail the caller. */
export async function notifyStudentsSafe(
  audience: { sectionId?: string | null; program?: NstpType | null },
  title: string,
  message: string
) {
  try {
    const ids = audience.sectionId
      ? (await prisma.studentProfile.findMany({
          where: { sectionId: audience.sectionId, user: { isActive: true, deletedAt: null } },
          select: { userId: true },
        })).map((profile) => profile.userId)
      : await activeStudentIds(audience.program)
    await notifySafe(ids, title, message)
  } catch (error) {
    console.error("Failed to notify students:", error instanceof Error ? error.message : error)
  }
}
