/* Parse pagination parameters from a query string object and return safe, bounded values */
export function getPagination(query: Record<string, string | undefined>) {
  // Parse 'page' as a positive integer; non-numeric/missing values fall back to 1
  const rawPage = Number(query.page ?? 1)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1
  // Parse 'pageSize' as a positive integer; clamp between 1 and 100 to prevent abuse
  const rawSize = Number(query.pageSize ?? 20)
  const pageSize = Number.isFinite(rawSize) && rawSize > 0 ? Math.min(100, Math.floor(rawSize)) : 20
  // Calculate the number of records to skip for the current page (0-based offset)
  const skip = (page - 1) * pageSize
  // Return all four values: current page, page size, skip offset, and take count
  return { page, pageSize, skip, take: pageSize }
}
