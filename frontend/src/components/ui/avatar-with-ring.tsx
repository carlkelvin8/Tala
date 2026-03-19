import { AuthUser, getUserInitials } from "../../lib/auth" // Import the AuthUser type and the initials generator function
import { getAvatarUrl, roleGradients, AvatarFrameType } from "../../lib/avatar" // Import the avatar URL getter, role gradient configs, and frame type
import { cn } from "../../lib/utils" // Import the cn utility for conditional class merging

// Props type for the AvatarWithRing component
type AvatarWithRingProps = {
  user: AuthUser | null // The authenticated user whose avatar to display; null renders a guest avatar
  size?: "sm" | "md" | "lg" | "xl" // Optional size variant controlling the avatar dimensions
  frameType?: AvatarFrameType // Optional explicit frame style override; falls back to user's saved preference
  showStatusDot?: boolean // Whether to show a small colored dot indicating the user's role/status
  className?: string // Optional additional CSS classes for the outer wrapper
}

// Tailwind class maps for each size variant
const sizeClasses = {
  sm: "h-8 w-8 text-xs", // Small: 32px avatar with extra-small text for initials
  md: "h-10 w-10 text-sm", // Medium: 40px avatar with small text for initials
  lg: "h-16 w-16 text-lg", // Large: 64px avatar with large text for initials
  xl: "h-24 w-24 text-2xl", // Extra large: 96px avatar with 2xl text for initials
}

// Padding classes for the ring wrapper at each size (controls ring thickness)
const ringPadding = {
  sm: "p-0.5", // 2px ring padding for small avatars
  md: "p-[3px]", // 3px ring padding for medium avatars
  lg: "p-1", // 4px ring padding for large avatars
  xl: "p-1.5", // 6px ring padding for extra large avatars
}

// Size classes for the status dot indicator at each avatar size
const dotSize = {
  sm: "h-2 w-2", // 8px dot for small avatars
  md: "h-3 w-3", // 12px dot for medium avatars
  lg: "h-4 w-4", // 16px dot for large avatars
  xl: "h-5 w-5", // 20px dot for extra large avatars
}

// Component that renders a user avatar with various decorative ring/frame styles
export function AvatarWithRing({
  user,
  size = "md", // Default to medium size
  frameType,
  showStatusDot = false, // Default to not showing the status dot
  className,
}: AvatarWithRingProps) {
  const avatarUrl = getAvatarUrl(user, 200) // Get the avatar URL (custom upload or DiceBear fallback) at 200px
  const initials = user ? getUserInitials(user) : "GU" // Get the user's initials or "GU" for guest user
  const gradient = user?.role ? roleGradients[user.role] : null // Get the role-based gradient config, or null if no user/role
  
  // Use user's selected frame or default to gradient
  const selectedFrame = frameType || (user?.avatarFrame as AvatarFrameType) || "gradient" // Prefer explicit frameType prop, then user's saved preference, then default to gradient

  // The inner avatar image element shared across all frame variants
  const avatarContent = (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-slate-900 text-white font-bold overflow-hidden", // Circular dark background with centered content and hidden overflow for the image
        sizeClasses[size] // Apply the size-specific dimensions
      )}
    >
      <img src={avatarUrl} alt={user?.email || "User"} className="h-full w-full object-cover" /> {/* Avatar image that fills the circle and covers the area */}
    </div>
  )

  // No frame — render the avatar without any ring decoration
  if (selectedFrame === "none") {
    return (
      <div className={cn("relative inline-block", className)}> {/* Relative container for optional status dot positioning */}
        {avatarContent} {/* Render the plain avatar image */}
        {showStatusDot && gradient && ( // Only render the status dot if enabled and gradient config exists
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white", // Position dot at bottom-right, with white border to separate from avatar
              dotSize[size] // Apply size-appropriate dot dimensions
            )}
            style={{ backgroundColor: gradient.from }} // Color the dot using the role's gradient start color
          />
        )}
      </div>
    )
  }

  // Gradient ring — single gradient border ring around the avatar
  if (selectedFrame === "gradient" && gradient) {
    return (
      <div className={cn("relative inline-block", className)}> {/* Relative container for status dot */}
        <div
          className={cn("rounded-full", ringPadding[size])} // Circular ring wrapper with size-appropriate padding
          style={{
            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`, // Diagonal gradient from role's start to end color
            boxShadow: gradient.shadow, // Apply the role-specific glow shadow
          }}
        >
          {avatarContent} {/* Avatar image inside the gradient ring */}
        </div>
        {showStatusDot && ( // Render status dot if enabled
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white", // Bottom-right positioned dot with white border
              dotSize[size] // Size-appropriate dot dimensions
            )}
            style={{ backgroundColor: gradient.from }} // Color using role's gradient start color
          />
        )}
      </div>
    )
  }

  // Double ring — two concentric gradient rings with a white gap between them
  if (selectedFrame === "double" && gradient) {
    return (
      <div className={cn("relative inline-block", className)}> {/* Relative container for status dot */}
        <div
          className={cn("rounded-full p-[2px]")} // Outer ring with 2px padding
          style={{
            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`, // Outer gradient ring
          }}
        >
          <div className="rounded-full bg-white p-[3px]"> {/* White gap ring between the two gradient rings */}
            <div
              className="rounded-full p-[2px]" // Inner ring with 2px padding
              style={{
                background: `linear-gradient(225deg, ${gradient.from}, ${gradient.to})`, // Inner gradient ring at opposite angle for visual depth
              }}
            >
              {avatarContent} {/* Avatar image at the center */}
            </div>
          </div>
        </div>
        {showStatusDot && ( // Render status dot if enabled
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white", // Bottom-right positioned dot
              dotSize[size] // Size-appropriate dot dimensions
            )}
            style={{ backgroundColor: gradient.from }} // Color using role's gradient start color
          />
        )}
      </div>
    )
  }

  // Neon glow — gradient ring with an intense outer glow effect
  if (selectedFrame === "glow" && gradient) {
    return (
      <div className={cn("relative inline-block", className)}> {/* Relative container for status dot */}
        <div
          className={cn("rounded-full", ringPadding[size])} // Circular ring wrapper
          style={{
            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`, // Gradient ring
            boxShadow: `0 0 30px ${gradient.from}, 0 0 60px ${gradient.to}`, // Double-layer neon glow: inner glow at 30px and outer glow at 60px
            filter: "brightness(1.1)", // Slightly brighten the entire element for a glowing effect
          }}
        >
          {avatarContent} {/* Avatar image inside the glowing ring */}
        </div>
        {showStatusDot && ( // Render status dot if enabled
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white", // Bottom-right positioned dot
              dotSize[size] // Size-appropriate dot dimensions
            )}
            style={{ 
              backgroundColor: gradient.from, // Color using role's gradient start color
              boxShadow: `0 0 10px ${gradient.from}` // Add a small glow to the status dot as well
            }}
          />
        )}
      </div>
    )
  }

  // Hexagon — clip the ring into an octagonal/hexagonal shape using CSS clip-path
  if (selectedFrame === "hexagon" && gradient) {
    return (
      <div className={cn("relative inline-block", className)}> {/* Relative container for status dot */}
        <div
          className={cn("rounded-full", ringPadding[size])} // Ring wrapper (rounded-full is overridden by clip-path)
          style={{
            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`, // Gradient fill for the hexagon shape
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)", // 8-point polygon approximating a hexagon
          }}
        >
          <div className="rounded-full" style={{ clipPath: "circle(50%)" }}> {/* Inner circle clip to keep the avatar circular inside the hexagon */}
            {avatarContent} {/* Avatar image */}
          </div>
        </div>
        {showStatusDot && ( // Render status dot if enabled
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white", // Bottom-right positioned dot
              dotSize[size] // Size-appropriate dot dimensions
            )}
            style={{ backgroundColor: gradient.from }} // Color using role's gradient start color
          />
        )}
      </div>
    )
  }

  // Badge style — thicker ring with an inset highlight and drop shadow for a badge-like appearance
  if (selectedFrame === "badge" && gradient) {
    return (
      <div className={cn("relative inline-block", className)}> {/* Relative container for status dot */}
        <div
          className={cn("rounded-full p-1")} // Thicker 4px ring padding for the badge style
          style={{
            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`, // Gradient ring
            boxShadow: `0 4px 12px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.3)`, // Drop shadow plus inset highlight for a 3D badge effect
          }}
        >
          <div className="rounded-full bg-white p-[2px]"> {/* White inner border for the badge style */}
            {avatarContent} {/* Avatar image */}
          </div>
        </div>
        {showStatusDot && ( // Render status dot if enabled
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white", // Bottom-right positioned dot
              dotSize[size] // Size-appropriate dot dimensions
            )}
            style={{ backgroundColor: gradient.from }} // Color using role's gradient start color
          />
        )}
      </div>
    )
  }

  // Default fallback — render the avatar without any frame if no matching frame type is found
  return (
    <div className={cn("relative inline-block", className)}> {/* Relative container */}
      {avatarContent} {/* Plain avatar image with no frame */}
    </div>
  )
}
