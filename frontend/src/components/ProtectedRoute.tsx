import { Navigate } from "react-router-dom"
import { getStoredUser } from "../lib/auth"
import { RoleType } from "../types"

type Props = {
  roles?: RoleType[]
  children: React.ReactNode
}

export function ProtectedRoute({ roles, children }: Props) {
  const user = getStoredUser()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}
