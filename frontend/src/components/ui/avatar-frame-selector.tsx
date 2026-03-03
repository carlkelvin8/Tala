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
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-1">Avatar Frame</h4>
        <p className="text-xs text-slate-500">Choose a frame style for your profile picture</p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {frames.map((frame) => {
          const isSelected = selectedFrame === frame
          const frameInfo = avatarFrames[frame]

          return (
            <button
              key={frame}
              onClick={() => onSelectFrame(frame)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all hover:border-slate-300",
                isSelected
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              {/* Preview */}
              <div className="relative">
                <AvatarWithRing user={user} size="md" frameType={frame} showStatusDot={false} />
                {isSelected && (
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="text-center">
                <p className="text-[10px] font-semibold text-slate-900 leading-tight">
                  {frameInfo.name}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Description */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
        <p className="text-xs text-slate-600">
          <span className="font-semibold">{avatarFrames[selectedFrame].name}:</span>{" "}
          {avatarFrames[selectedFrame].description}
        </p>
      </div>
    </div>
  )
}
