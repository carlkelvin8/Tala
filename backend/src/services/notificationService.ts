import { NotificationType } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

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
