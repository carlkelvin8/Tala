import { useDeferredValue, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, ShieldCheck } from "lucide-react"
import { apiRequest } from "../lib/api"
import type { ApiResponse, RoleType } from "../types"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { EmptyState } from "../components/ui/empty-state"

type AuditLog = {
  id: string
  action: string
  entity: string
  entityId?: string | null
  meta?: unknown
  createdAt: string
  actor?: { id: string; email: string; role: RoleType } | null
}

export function AuditLogsPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const deferredSearch = useDeferredValue(search)
  const pageSize = 25

  const query = useQuery({
    queryKey: ["audit-logs", deferredSearch, page],
    queryFn: () => apiRequest<ApiResponse<AuditLog[]>>(
      `/api/audit-logs?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(deferredSearch)}`
    ),
  })

  const logs = query.data?.data ?? []
  const total = query.data?.meta?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-gradient-to-br from-navy via-royal to-navy p-6 text-white shadow-card">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20"><ShieldCheck className="h-5 w-5" /></span>
          <div><h1 className="text-2xl font-bold">Audit Logs</h1><p className="text-sm text-silver">Review security and data-change activity across the system.</p></div>
        </div>
      </header>

      <section className="rounded-2xl border border-silver/30 bg-white p-4 shadow-card sm:p-6">
        <label htmlFor="audit-search" className="sr-only">Search audit logs</label>
        <div className="relative mb-5 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
          <Input id="audit-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search action, entity, or actor…" className="pl-9" />
        </div>

        {query.isLoading ? <div className="h-64 animate-pulse rounded-xl bg-slate-100" aria-label="Loading audit logs" /> :
        query.isError ? <EmptyState title="Could not load audit logs" description={query.error instanceof Error ? query.error.message : "Try again."} action={<Button onClick={() => query.refetch()}>Retry</Button>} /> :
        logs.length === 0 ? <EmptyState title="No audit events found" description="Try a different search term." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead><tr className="border-b text-xs uppercase tracking-wide text-darksilver"><th className="px-3 py-3">When</th><th className="px-3 py-3">Actor</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Entity</th><th className="px-3 py-3">Record</th></tr></thead>
              <tbody>{logs.map((log) => <tr key={log.id} className="border-b border-silver/20 last:border-0"><td className="whitespace-nowrap px-3 py-3 text-darksilver">{new Date(log.createdAt).toLocaleString()}</td><td className="px-3 py-3"><div className="font-medium">{log.actor?.email ?? "System"}</div><div className="text-xs text-darksilver">{log.actor?.role ?? "SYSTEM"}</div></td><td className="px-3 py-3"><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold">{log.action}</span></td><td className="px-3 py-3 font-medium">{log.entity}</td><td className="max-w-48 truncate px-3 py-3 font-mono text-xs text-darksilver" title={log.entityId ?? undefined}>{log.entityId ?? "—"}</td></tr>)}</tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between text-sm"><span className="text-darksilver">{total} events</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span>Page {page} of {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>
      </section>
    </div>
  )
}
