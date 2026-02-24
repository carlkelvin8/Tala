export type ApiMeta = {
  page?: number
  pageSize?: number
  total?: number
}

export type ApiResponse<T> = {
  success: boolean
  message: string
  data?: T
  meta?: ApiMeta
}

export function ok<T>(message: string, data?: T, meta?: ApiMeta): ApiResponse<T> {
  return { success: true, message, data, meta }
}

export function fail(message: string, data?: unknown): ApiResponse<unknown> {
  return { success: false, message, data }
}
