import * as React from "react"
import { cn } from "../../lib/utils"

interface PasswordStrengthProps {
  password: string
  className?: string
}

interface StrengthResult {
  score: number // 0-4
  label: string
  color: string
  criteria: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    numbers: boolean
    special: boolean
  }
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const getStrength = React.useMemo((): StrengthResult => {
    if (!password) {
      return {
        score: 0,
        label: "Enter a password",
        color: "bg-slate-200",
        criteria: {
          length: false,
          uppercase: false,
          lowercase: false,
          numbers: false,
          special: false
        }
      }
    }

    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const metCriteria = Object.values(criteria).filter(Boolean).length
    
    if (metCriteria <= 1) {
      return {
        score: 1,
        label: "Very weak",
        color: "bg-red-500",
        criteria
      }
    } else if (metCriteria <= 2) {
      return {
        score: 2,
        label: "Weak",
        color: "bg-orange-500",
        criteria
      }
    } else if (metCriteria <= 3) {
      return {
        score: 3,
        label: "Medium",
        color: "bg-yellow-500",
        criteria
      }
    } else {
      return {
        score: 4,
        label: "Strong",
        color: "bg-green-500",
        criteria
      }
    }
  }, [password])

  const strength = getStrength

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-2 flex-1 gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "h-full flex-1 rounded-full transition-all duration-300",
                level <= strength.score ? strength.color : "bg-slate-200"
              )}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-slate-600 min-w-[60px]">
          {strength.label}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div className={cn("flex items-center gap-1", strength.criteria.length ? "text-green-600" : "text-slate-400")}>
          <div className={cn("h-1.5 w-1.5 rounded-full", strength.criteria.length ? "bg-green-500" : "bg-slate-300")} />
          8+ characters
        </div>
        <div className={cn("flex items-center gap-1", strength.criteria.uppercase ? "text-green-600" : "text-slate-400")}>
          <div className={cn("h-1.5 w-1.5 rounded-full", strength.criteria.uppercase ? "bg-green-500" : "bg-slate-300")} />
          Uppercase
        </div>
        <div className={cn("flex items-center gap-1", strength.criteria.lowercase ? "text-green-600" : "text-slate-400")}>
          <div className={cn("h-1.5 w-1.5 rounded-full", strength.criteria.lowercase ? "bg-green-500" : "bg-slate-300")} />
          Lowercase
        </div>
        <div className={cn("flex items-center gap-1", strength.criteria.numbers ? "text-green-600" : "text-slate-400")}>
          <div className={cn("h-1.5 w-1.5 rounded-full", strength.criteria.numbers ? "bg-green-500" : "bg-slate-300")} />
          Numbers
        </div>
        <div className={cn("flex items-center gap-1 col-span-2", strength.criteria.special ? "text-green-600" : "text-slate-400")}>
          <div className={cn("h-1.5 w-1.5 rounded-full", strength.criteria.special ? "bg-green-500" : "bg-slate-300")} />
          Special characters (!@#$%^&*)
        </div>
      </div>
    </div>
  )
}