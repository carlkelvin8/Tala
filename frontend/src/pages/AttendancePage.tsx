import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { useState } from "react"
import { PageHeader } from "../components/ui/page-header"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { StatusBadge } from "../components/ui/status-badge"
import { toast } from "sonner"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { Badge } from "../components/ui/badge"
import { Card, CardContent } from "../components/ui/card"
import { Select } from "../components/ui/select"
import { MapPin, Clock, CheckCircle2, AlertTriangle, Camera } from "lucide-react"
import { getFullName } from "../lib/display"

type Geo = { latitude: number; longitude: number }

async function getLocation(): Promise<Geo> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err)
    )
  })
}

export function AttendancePage() {
  const [status, setStatus] = useState<{ message: string; variant: "success" | "danger" } | null>(null)
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PRESENT" | "LATE" | "ABSENT">("ALL")
  const attendanceQuery = useQuery({
    queryKey: ["attendance"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/attendance"),
    refetchInterval: 5000
  })

  const checkInMutation = useMutation({
    mutationFn: (payload: Geo) =>
      apiRequest<ApiResponse<any>>("/api/attendance/check-in", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      attendanceQuery.refetch()
      toast.success("Checked in")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Check in failed")
    }
  })

  const checkOutMutation = useMutation({
    mutationFn: (payload: Geo) =>
      apiRequest<ApiResponse<any>>("/api/attendance/check-out", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      attendanceQuery.refetch()
      toast.success("Checked out")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Check out failed")
    }
  })

  const handleCheckIn = async () => {
    try {
      const geo = await getLocation()
      await checkInMutation.mutateAsync(geo)
      setStatus({ message: "Checked in successfully", variant: "success" })
    } catch {
      setStatus({ message: "Unable to access location", variant: "danger" })
    }
  }

  const handleCheckOut = async () => {
    try {
      const geo = await getLocation()
      await checkOutMutation.mutateAsync(geo)
      setStatus({ message: "Checked out successfully", variant: "success" })
    } catch {
      setStatus({ message: "Unable to access location", variant: "danger" })
    }
  }
  const rows = attendanceQuery.data?.data ?? []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayRecord = rows.find((record: any) => {
    if (!record.date) return false
    const recordDate = new Date(record.date)
    recordDate.setHours(0, 0, 0, 0)
    return recordDate.getTime() === today.getTime()
  }) as any | undefined

  const latestRecord = (rows[0] as any | undefined) ?? todayRecord

  const lastCheckIn =
    latestRecord && latestRecord.checkInAt ? new Date(latestRecord.checkInAt).toLocaleTimeString() : null
  const lastCheckOut =
    latestRecord && latestRecord.checkOutAt ? new Date(latestRecord.checkOutAt).toLocaleTimeString() : null

  const verificationMethod = latestRecord ? "Geolocation" : "Not recorded"

  const filteredRows =
    statusFilter === "ALL" ? rows : rows.filter((record: any) => record.status === statusFilter)

  const columns = [
    {
      header: "Student",
      cell: (record: any) => (
        <div className="leading-tight">
          <p className="text-sm font-medium text-slate-800">{getFullName(record.user)}</p>
          {record.user?.email && (
            <p className="text-xs text-slate-400">{record.user.email}</p>
          )}
        </div>
      ),
    },
    {
      header: "Date",
      cell: (record: any) => new Date(record.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    },
    {
      header: "Status",
      cell: (record: any) => <StatusBadge status={record.status} />,
    },
    {
      header: "Check In",
      cell: (record: any) => (record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString() : "—"),
    },
    {
      header: "Check Out",
      cell: (record: any) => (record.checkOutAt ? new Date(record.checkOutAt).toLocaleTimeString() : "—"),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Log participation using device geolocation today and prepare for biometric verification."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span>Logging enabled</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3 text-slate-500" />
              <span>Location required</span>
            </Badge>
          </div>
        }
      />
      <Card className="border-slate-200/80 bg-white/80 shadow-sm">
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Today</div>
            <div className="mt-2">
              {todayRecord ? (
                <StatusBadge status={todayRecord.status} />
              ) : (
                <Badge variant="outline">Not checked in</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Last check-in: {lastCheckIn ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Last check-out: {lastCheckOut ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span>Verification: {verificationMethod}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <SectionCard
          title="Geolocation Attendance"
          description="Use your device location to log attendance."
          actions={
            <Badge variant="info" className="text-xs">
              Core method
            </Badge>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span>Allow location access in your browser to enable check-in.</span>
              </div>
              {latestRecord && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <span>
                    Latest status:{" "}
                    <span className="font-medium text-slate-700">{latestRecord.status}</span>
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCheckIn} disabled={checkInMutation.isPending} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{checkInMutation.isPending ? "Checking in..." : "Check In"}</span>
              </Button>
              <Button
                onClick={handleCheckOut}
                variant="outline"
                disabled={checkOutMutation.isPending}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                <span>{checkOutMutation.isPending ? "Checking out..." : "Check Out"}</span>
              </Button>
            </div>
            {status && <Alert variant={status.variant}>{status.message}</Alert>}
          </div>
        </SectionCard>
        <SectionCard
          title="Facial Recognition Attendance"
          description="Future-ready verification workflow placeholder."
          actions={
            <Badge variant="outline" className="text-xs">
              Placeholder
            </Badge>
          }
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/5 text-slate-700">
              <Camera className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-slate-600">
                This section is reserved for future facial recognition integration, aligned with your institution&apos;s
                verification provider.
              </p>
              <p className="text-xs text-slate-500">
                Use the simulation flow during development to validate audit logs and attendance state changes before
                connecting a live biometric service.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Button variant="secondary" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Simulate Verification</span>
              </Button>
              <p className="max-w-[220px] text-xs text-slate-500">
                No biometric data is processed yet. This is a safe placeholder for integration.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
      <SectionCard
        title="Attendance History"
        description="Review recent attendance activity."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | "PRESENT" | "LATE" | "ABSENT")}
              className="h-9 w-[160px]"
            >
              <option value="ALL">All statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => attendanceQuery.refetch()}
            >
              Refresh
            </Button>
          </div>
        }
      >
        {attendanceQuery.isError && <Alert variant="danger">Unable to load attendance history.</Alert>}
        {attendanceQuery.isLoading ? (
          <LoadingSkeleton rows={3} columns={4} />
        ) : rows.length === 0 ? (
          <EmptyState title="No attendance records" description="Check in to start building your history." />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No records for this status"
            description="Try selecting a different attendance status filter."
          />
        ) : (
          <ResponsiveTableCards
            data={filteredRows}
            columns={columns}
            rowKey={(record) => record.id}
            renderTitle={(record) => new Date(record.date).toLocaleDateString()}
          />
        )}
      </SectionCard>
    </div>
  )
}
