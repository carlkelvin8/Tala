import { NstpType, RoleType } from "@prisma/client"

export type AuthUser = {
  id: string
  role: RoleType
  email: string
  program?: NstpType | null
  sectionId?: string
}
