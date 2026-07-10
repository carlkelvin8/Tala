import { getStoredUser } from "../lib/auth"

export type PermissionSet = {
  canEdit: boolean
  canDelete: boolean
  canCreate: boolean
  isViewOnly: boolean
  sectionId: string | null
}

export function usePermissions(): PermissionSet {
  const user = getStoredUser()

  if (!user) {
    return { canEdit: false, canDelete: false, canCreate: false, isViewOnly: true, sectionId: null }
  }

  const isViewOnly = user.role === "CADET_OFFICER" || user.role === "STUDENT"
  const canEdit = !isViewOnly && (user.role === "ADMIN" || user.role === "IMPLEMENTOR")
  const canDelete = user.role === "ADMIN"
  const canCreate = canEdit

  return {
    canEdit,
    canDelete,
    canCreate,
    isViewOnly,
    sectionId: user.sectionId ?? null
  }
}
