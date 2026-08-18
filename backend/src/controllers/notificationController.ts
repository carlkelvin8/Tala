import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { getAuthUser } from "../middlewares/auth.js"
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from "../services/notificationService.js"

export async function listHandler(c: Context) {
  try {
    const user = getAuthUser(c)
    const unreadOnly = c.req.query("unreadOnly") === "true"
    const notifications = await getUserNotifications(user.id, unreadOnly)
    return c.json(ok("Notifications fetched", notifications))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch notifications"), 400)
  }
}

export async function markReadHandler(c: Context) {
  try {
    const user = getAuthUser(c)
    const id = c.req.param("id")
    const notification = await markAsRead(id, user.id)
    return c.json(ok("Notification marked as read", notification))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to mark notification as read"), 400)
  }
}

export async function markAllReadHandler(c: Context) {
  try {
    const user = getAuthUser(c)
    const result = await markAllAsRead(user.id)
    return c.json(ok("All notifications marked as read", result))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to mark all notifications as read"), 400)
  }
}

export async function unreadCountHandler(c: Context) {
  try {
    const user = getAuthUser(c)
    const count = await getUnreadCount(user.id)
    return c.json(ok("Unread count fetched", { count }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch unread count"), 400)
  }
}
