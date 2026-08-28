import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { StatusBadge } from "../components/ui/status-badge"
import { EmptyState } from "../components/ui/empty-state"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { apiRequest } from "../lib/api"
import { ApiResponse, ProgramType } from "../types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../lib/utils"

const PAGE_SIZE = 8

export function DataTable({ program }: { program?: ProgramType }) {
  const [page, setPage] = useState(1)

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["dashboard-attendance-recent", page, program ?? "all"],
    queryFn: () =>
      apiRequest<ApiResponse<any[]>>(
        `/api/attendance?page=${page}&pageSize=${PAGE_SIZE}${program ? `&program=${program}` : ""}`
      ),
    placeholderData: (prev) => prev,
  })

  const records = response?.data ?? []
  const total = response?.meta?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="rounded-2xl border border-silver/20 bg-white shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-silver/20 px-4 sm:px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-black">Recent Attendance</h3>
          <p className="mt-0.5 text-xs text-darksilver">
            {total > 0 ? `${total} total records` : "Latest attendance events"}
          </p>
        </div>
        {total > 0 && (
          <span className="text-[11px] font-medium text-darksilver">
            Page {page} of {totalPages}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="px-4 sm:px-6 pt-3 pb-2">
        {isError && (
          <p className="py-4 text-sm text-rose-500">Unable to load attendance records.</p>
        )}
        {isLoading ? (
          <LoadingSkeleton rows={PAGE_SIZE} columns={4} />
        ) : records.length === 0 ? (
          <div className="py-4">
            <EmptyState
              title="No attendance yet"
              description="Activity will appear here once events are recorded."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-silver/20">
                    {["Cadet", "Date", "Status", "Check-in", "Check-out"].map((h) => (
                      <th
                        key={h}
                        className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-widest text-darksilver last:pr-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-silver/20">
                  {records.map((record: any) => {
                    const userEmail: string = record.user?.email ?? "—"
                    const date = record.date
                      ? new Date(record.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"
                    const checkIn = record.checkInAt
                      ? new Date(record.checkInAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"
                    const checkOut = record.checkOutAt
                      ? new Date(record.checkOutAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"

                    return (
                      <tr key={record.id} className="group transition-colors hover:bg-white/60">
                        <td className="py-3 pr-4">
                          <span className="max-w-[160px] truncate block text-black/80 text-xs">
                            {userEmail}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-darksilver whitespace-nowrap">{date}</td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="py-3 pr-4 text-darksilver whitespace-nowrap tabular-nums">{checkIn}</td>
                        <td className="py-3 text-darksilver whitespace-nowrap tabular-nums">{checkOut}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-silver/20 px-4 sm:px-6 py-3">
          <span className="text-xs text-darksilver">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg border text-darksilver transition-colors",
                page === 1
                  ? "border-silver/20 text-silver cursor-not-allowed"
                  : "border-silver/30 hover:bg-white"
              )}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…")
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs text-silver">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={cn(
                      "flex h-7 min-w-[28px] items-center justify-center rounded-lg border px-2 text-xs font-medium transition-colors",
                      page === p
                        ? "border-black bg-navy text-white"
                        : "border-silver/30 text-darksilver hover:bg-white"
                    )}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg border text-darksilver transition-colors",
                page === totalPages
                  ? "border-silver/20 text-silver cursor-not-allowed"
                  : "border-silver/30 hover:bg-white"
              )}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
