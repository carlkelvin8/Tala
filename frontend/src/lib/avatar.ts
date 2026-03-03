import { AuthUser } from "./auth"

/**
 * Generate a DiceBear avatar URL based on user information
 * Uses the "avataaars" style for a friendly, professional look
 */
export function getDiceBearAvatar(user: AuthUser | null, size: number = 200): string {
  if (!user) {
    return `https://api.dicebear.com/9.x/avataaars/svg?seed=guest&size=${size}`
  }
  
  // Use email as seed for consistent avatars
  const seed = encodeURIComponent(user.email)
  
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9`
}

/**
 * Get avatar URL - returns uploaded avatar or DiceBear fallback
 */
export function getAvatarUrl(user: AuthUser | null, size: number = 200): string {
  if (user?.avatarUrl) {
    return user.avatarUrl
  }
  return getDiceBearAvatar(user, size)
}

/**
 * Role-based gradient configurations for avatar rings
 */
export const roleGradients = {
  ADMIN: {
    from: "#8b5cf6", // violet-500
    to: "#a78bfa",   // violet-400
    shadow: "0 0 20px rgba(139, 92, 246, 0.4)",
  },
  IMPLEMENTOR: {
    from: "#0ea5e9", // sky-500
    to: "#38bdf8",   // sky-400
    shadow: "0 0 20px rgba(14, 165, 233, 0.4)",
  },
  CADET_OFFICER: {
    from: "#f59e0b", // amber-500
    to: "#fbbf24",   // amber-400
    shadow: "0 0 20px rgba(245, 158, 11, 0.4)",
  },
  STUDENT: {
    from: "#10b981", // emerald-500
    to: "#34d399",   // emerald-400
    shadow: "0 0 20px rgba(16, 185, 129, 0.4)",
  },
} as const

/**
 * Available avatar frame styles
 */
export type AvatarFrameType = "none" | "gradient" | "double" | "glow" | "hexagon" | "badge"

export const avatarFrames = {
  none: {
    name: "No Frame",
    description: "Clean, simple avatar",
  },
  gradient: {
    name: "Gradient Ring",
    description: "Smooth gradient border",
  },
  double: {
    name: "Double Ring",
    description: "Two-layer border",
  },
  glow: {
    name: "Neon Glow",
    description: "Glowing effect",
  },
  hexagon: {
    name: "Hexagon",
    description: "Hexagonal frame",
  },
  badge: {
    name: "Badge Style",
    description: "Badge-like border",
  },
} as const
