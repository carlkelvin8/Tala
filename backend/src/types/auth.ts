import { RoleType } from "@prisma/client"

export type AuthUser = {
  id: string
  role: RoleType
  email: string
}
