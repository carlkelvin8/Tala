import { AuthUser } from "../../lib/auth" // Import the AuthUser type for the user prop
import { avatarFrames, AvatarFrameType } from "../../lib/avatar" // Import the frame metadata map and the frame type union
import { AvatarWithRing } from "./avatar-with-ring" // Import the avatar component to render live previews of each frame
import { cn } from "../../lib/utils" // Import the cn utility for conditional class merging
import { Check } from "lucide-react" // Import the Check icon to indicate the currently selected frame

// Props type for the AvatarFrameSelector component
type AvatarFrameSelectorProps = {
  user: AuthUser | null // The user whose avatar is used in the frame previews
  selectedFrame: AvatarFrameType // The currently selected frame type
  onSelectFrame: (frame: AvatarFrameType) => void // Callback invoked when the user clicks a frame option
}

// Component that renders a grid of selectable avatar frame styles with live previews
export function AvatarFrameSelector({ user, selectedFrame, onSelectFrame }: AvatarFrameSelectorProps) {
  const frames: AvatarFrameType[] = ["none", "gradient", "double", "glow", "hexagon"] // The list of frame options to display (badge is excluded from the selector)

  return (
    <div className="space-y-4"> {/* Vertical stack with spacing between the header, grid, and description */}
      <div> {/* Header section */}
        <h4 className="text-sm font-semibold text-slate-900 mb-1">Avatar Frame Style</h4> {/* Section title */}
        <p className="text-xs text-slate-500">Choose how your profile picture appears</p> {/* Subtitle explaining the purpose */}
      </div>

      <div className="grid grid-cols-3 gap-2"> {/* 3-column grid for the frame option buttons */}
        {frames.map((frame) => { // Iterate over each available frame type
          const isSelected = selectedFrame === frame // Check if this frame is the currently selected one
          const frameInfo = avatarFrames[frame] // Get the display name and description for this frame

          return (
            <button
              key={frame} // Use the frame type string as the React key
              onClick={() => onSelectFrame(frame)} // Call the parent's onSelectFrame callback with this frame type when clicked
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border-2 p-2 transition-all hover:border-slate-400", // Base styles: relative positioning, flex column, centered, rounded, border, padding, hover effect
                isSelected
                  ? "border-slate-900 bg-slate-50 shadow-sm" // Selected state: dark border, light background, subtle shadow
                  : "border-slate-200 bg-white" // Unselected state: light border, white background
              )}
            >
              {/* Preview */}
              <div className="relative"> {/* Relative container for the avatar preview and the checkmark badge */}
                <AvatarWithRing user={user} size="sm" frameType={frame} showStatusDot={false} /> {/* Small avatar preview with this frame applied */}
                {isSelected && ( // Only show the checkmark badge on the selected frame
                  <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white"> {/* Small dark circle positioned at top-right of the preview */}
                    <Check className="h-2.5 w-2.5" /> {/* Small check icon inside the badge */}
                  </div>
                )}
              </div>

              {/* Label */}
              <p className="text-[9px] font-semibold text-slate-700 leading-tight text-center"> {/* Very small centered label below the preview */}
                {frameInfo.name} {/* Display the human-readable frame name */}
              </p>
            </button>
          )
        })}
      </div>

      {/* Description */}
      <div className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2"> {/* Info box showing the description of the selected frame */}
        <p className="text-xs text-slate-700"> {/* Small text for the description */}
          <span className="font-semibold">{avatarFrames[selectedFrame].name}:</span>{" "} {/* Bold frame name followed by a colon */}
          {avatarFrames[selectedFrame].description} {/* Description of the currently selected frame */}
        </p>
      </div>
    </div>
  )
}
