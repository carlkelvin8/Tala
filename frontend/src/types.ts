export type RoleType = "ADMIN" | "IMPLEMENTOR" | "CADET_OFFICER" | "STUDENT"

export type ApiResponse<T> = {
  success: boolean
  message: string
  data?: T
  meta?: {
    page?: number
    pageSize?: number
    total?: number
  }
}
