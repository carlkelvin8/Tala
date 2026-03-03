import { AuthUser, getUserInitials } from "../../lib/auth"
import { getAvatarUrl, roleGradients, AvatarFrameType } from "../../lib/avatar"
import { cn } from "../../lib/utils"

type AvatarWithRingProps = {
  user: AuthUser | null
  size?: "sm" | "md" | "lg" | "xl"
  frameType?: AvatarFrameType
  showStatusDot?: boolean
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
}

const ringPadding = {
  sm: "p-0.5",
  md: "p-[3px]",
  lg: "p-1",
  xl: "p-1.5",
}

const dotSize = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
  xl: "h-5 w-5",
}

export function AvatarWithRing({
  user,
  size = "md",
  frameType,
  showStatusDot = false,
  className,
}: AvatarWithRingProps) {
  const avatarUrl = getAvatarUrl(user, 200)
  const initials = user ? getUserInitials(user) : "GU"
  const gradient = user?.role ? roleGradients[user.role] : null
  
  // Use user's selected frame or default to gradient
  const selectedFrame = frameType || (user?.avatarFrame as AvatarFrameType) || "gradient"

  const avatarContent = (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-slate-900 text-white font-bold overflow-hidden",
        sizeClasses[size]
      )}
    >
      <img src={avatarUrl} alt={user?.email || "User"} className="h-full w-full object-cover" />
    </div>
  )

  // No frame
  if (selectedFrame === "none") {
    return (
      <div className={cn("relative inline-block", className)}>
        {avatarContent}
        {showStatusDot && gradient && (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white",
              dotSize[size]
            )}
            style={{ backgroundColor: gradient.from }}
          />
        )}
      </div>
    )
  }

  // Gradient ring
  if (selectedFrame === "gradient" && gradient) {
    return (
      <div className={cn("relative inline-block", className)}>
        <div
          className={cn("rounded-full", ringPadding[size])}
          style={{
            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
            boxShadow: gradient.shadow,
          }}
        >
          {avatarContent}
        </div>
        {showStatusDot && (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white",
              dotSize[size]
            )}
            style={{ backgroundColor: gradient.from }}
          />
        )}
      </div>
    )
  }

  // Double ring
  if (selectedFrame === "double" && gradient) {
    return (
      <div className={cn("relative inline-block", className)}>
        <div
          className={cn("rounded-full p-[2px]")}
          style={{
            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
          }}
        >
          <div className="rounded-full bg-white p-[3px]">
            <div
              className="rounded-full p-[2px]"
              style={{
                background: `linear-gradient(225deg, ${gradient.from}, ${gradient.to})`,
              }}
            >
              {avatarContent}
            </div>
          </div>
        </div>
        {showStatusDot && (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white",
              dotSize[size]
            )}
            style={{ backgroundColor: gradient.from }}
          />
        )}
      </div>
    )
  }

  // Neon glow
  if (selectedFrame === "glow" && gradient) {
    return (
      <div className={cn("relative inline-block", className)}>
        <div
          className={cn("rounded-full", ringPadding[size])}
          style={{
            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
            boxShadow: `0 0 30px ${gradient.from}, 0 0 60px ${gradient.to}`,
            filter: "brightness(1.1)",
          }}
        >
          {avatarContent}
        </div>
        {showStatusDot && (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white",
              dotSize[size]
            )}
            style={{ 
              backgroundColor: gradient.from,
              boxShadow: `0 0 10px ${gradient.from}`
            }}
          />
        )}
      </div>
    )
  }

  // Hexagon
  if (selectedFrame === "hexagon" && gradient) {
    return (
      <div className={cn("relative inline-block", className)}>
        <div
          className={cn("rounded-full", ringPadding[size])}
          style={{
            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
          }}
        >
          <div className="rounded-full" style={{ clipPath: "circle(50%)" }}>
            {avatarContent}
          </div>
        </div>
        {showStatusDot && (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white",
              dotSize[size]
            )}
            style={{ backgroundColor: gradient.from }}
          />
        )}
      </div>
    )
  }

  // Badge style
  if (selectedFrame === "badge" && gradient) {
    return (
      <div className={cn("relative inline-block", className)}>
        <div
          className={cn("rounded-full p-1")}
          style={{
            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
            boxShadow: `0 4px 12px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.3)`,
          }}
        >
          <div className="rounded-full bg-white p-[2px]">
            {avatarContent}
          </div>
        </div>
        {showStatusDot && (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white",
              dotSize[size]
            )}
            style={{ backgroundColor: gradient.from }}
          />
        )}
      </div>
    )
  }

  // Default fallback
  return (
    <div className={cn("relative inline-block", className)}>
      {avatarContent}
    </div>
  )
}
