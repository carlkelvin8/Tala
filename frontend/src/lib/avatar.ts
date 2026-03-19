import { AuthUser } from "./auth" // Import the AuthUser type to type-check the user parameter

/**
 * Generate a DiceBear avatar URL based on user information
 * Uses the "avataaars" style for a friendly, professional look
 */
// Build a DiceBear avatar URL using the user's email as a seed for consistent generation
export function getDiceBearAvatar(user: AuthUser | null, size: number = 200): string {
  if (!user) { // If no user is provided, return a generic guest avatar
    return `https://api.dicebear.com/9.x/avataaars/svg?seed=guest&size=${size}` // Use "guest" as the seed for anonymous users
  }
  
  // Use email as seed for consistent avatars
  const seed = encodeURIComponent(user.email) // URL-encode the email to safely use it as a query parameter seed
  
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9` // Build the DiceBear URL with the user's email seed, requested size, and a set of soft background colors
}

/**
 * Get avatar URL - returns uploaded avatar or DiceBear fallback
 */
// Return the user's custom uploaded avatar URL if available, otherwise generate a DiceBear fallback
export function getAvatarUrl(user: AuthUser | null, size: number = 200): string {
  if (user?.avatarUrl) { // If the user has a custom avatar URL stored
    return user.avatarUrl // Return the custom avatar URL directly
  }
  return getDiceBearAvatar(user, size) // Otherwise generate and return a DiceBear avatar URL
}

/**
 * Role-based gradient configurations for avatar rings
 */
// Map each user role to a set of gradient colors and shadow styles for the avatar ring
export const roleGradients = {
  ADMIN: {
    from: "#8b5cf6", // violet-500 — start color of the gradient ring for admins
    to: "#a78bfa",   // violet-400 — end color of the gradient ring for admins
    shadow: "0 0 20px rgba(139, 92, 246, 0.4)", // Soft violet glow shadow for the admin ring
  },
  IMPLEMENTOR: {
    from: "#0ea5e9", // sky-500 — start color of the gradient ring for implementors
    to: "#38bdf8",   // sky-400 — end color of the gradient ring for implementors
    shadow: "0 0 20px rgba(14, 165, 233, 0.4)", // Soft sky-blue glow shadow for the implementor ring
  },
  CADET_OFFICER: {
    from: "#f59e0b", // amber-500 — start color of the gradient ring for cadet officers
    to: "#fbbf24",   // amber-400 — end color of the gradient ring for cadet officers
    shadow: "0 0 20px rgba(245, 158, 11, 0.4)", // Soft amber glow shadow for the cadet officer ring
  },
  STUDENT: {
    from: "#10b981", // emerald-500 — start color of the gradient ring for students
    to: "#34d399",   // emerald-400 — end color of the gradient ring for students
    shadow: "0 0 20px rgba(16, 185, 129, 0.4)", // Soft emerald glow shadow for the student ring
  },
} as const // Mark as const to preserve literal types and prevent mutation

/**
 * Available avatar frame styles
 */
// Union type of all valid avatar frame style identifiers
export type AvatarFrameType = "none" | "gradient" | "double" | "glow" | "hexagon" | "badge"

// Map each frame type to its display name and description for use in the frame selector UI
export const avatarFrames = {
  none: {
    name: "No Frame", // Display name shown in the frame selector
    description: "Clean, simple avatar", // Short description of this frame style
  },
  gradient: {
    name: "Gradient Ring", // Display name for the gradient ring frame
    description: "Smooth gradient border", // Short description of the gradient ring style
  },
  double: {
    name: "Double Ring", // Display name for the double ring frame
    description: "Two-layer border", // Short description of the double ring style
  },
  glow: {
    name: "Neon Glow", // Display name for the neon glow frame
    description: "Glowing effect", // Short description of the neon glow style
  },
  hexagon: {
    name: "Hexagon", // Display name for the hexagon frame
    description: "Hexagonal frame", // Short description of the hexagon clip-path style
  },
  badge: {
    name: "Badge Style", // Display name for the badge frame
    description: "Badge-like border", // Short description of the badge-style frame
  },
} as const // Mark as const to preserve literal types and prevent mutation
