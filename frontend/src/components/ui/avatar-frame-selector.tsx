import { AuthUser } from "../../lib/auth"
import { avatarFrames, AvatarFrameType } from "../../lib/avatar"
import { AvatarWithRing } from "./avatar-with-ring"
import { cn } from "../../lib/utils"
import { Check } from "lucide-react"

type AvatarFrameSelectorProps = {
  user: AuthUser | null
  selectedFrame: AvatarFrameType
  onSelectFrame: (frame: AvatarFrameType) => void
}

export function AvatarFrameSelector({ user, selectedFrame, onSelectFrame }: AvatarFrameSelectorProps) {
  const frames: AvatarFrameType[] = ["none", "gradient", "double", "glow", "hexagon"]

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-1">Avatar Frame Style</h4>
        <p className="text-xs text-slate-500">Choose how your profile picture appears</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {frames.map((frame) => {
          const isSelected = selectedFrame === frame
          const frameInfo = avatarFrames[frame]

          return (
            <button
              key={frame}
              onClick={() => onSelectFrame(frame)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border-2 p-2 transition-all hover:border-slate-400",
                isSelected
                  ? "border-slate-900 bg-slate-50 shadow-sm"
                  : "border-slate-200 bg-white"
              )}
            >
              {/* Preview */}
              <div className="relative">
                <AvatarWithRing user={user} size="sm" frameType={frame} showStatusDot={false} />
                {isSelected && (
                  <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>

              {/* Label */}
              <p className="text-[9px] font-semibold text-slate-700 leading-tight text-center">
                {frameInfo.name}
              </p>
            </button>
          )
        })}
      </div>

      {/* Description */}
      <div className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2">
        <p className="text-xs text-slate-700">
          <span className="font-semibold">{avatarFrames[selectedFrame].name}:</span>{" "}
          {avatarFrames[selectedFrame].description}
        </p>
      </div>
    </div>
  )
}
