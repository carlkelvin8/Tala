import { useMutation, useQuery } from "@tanstack/react-query" // Import useMutation for check-in/check-out and useQuery for fetching attendance records
import { apiRequest } from "../lib/api" // Import the generic API request helper
import { ApiResponse } from "../types" // Import the generic API response wrapper type
import { Button } from "../components/ui/button" // Import the reusable Button component
import { useState } from "react" // Import useState for managing status messages and filter state
import { PageHeader } from "../components/ui/page-header" // Import the PageHeader component
import { Alert } from "../components/ui/alert" // Import the Alert component for status messages
import { EmptyState } from "../components/ui/empty-state" // Import the EmptyState component for empty list state
import { StatusBadge } from "../components/ui/status-badge" // Import the StatusBadge for attendance status display
import { toast } from "sonner" // Import toast for notifications
import { SectionCard } from "../components/ui/section-card" // Import the SectionCard wrapper for sections
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards" // Import the responsive table/card component
import { LoadingSkeleton } from "../components/ui/loading-skeleton" // Import the loading skeleton
import { Badge } from "../components/ui/badge" // Import the Badge component for status indicators
import { Card, CardContent } from "../components/ui/card" // Import Card and CardContent for the today's status card
import { Select } from "../components/ui/select" // Import the Select component for the status filter dropdown
import { MapPin, Clock, CheckCircle2, AlertTriangle, Camera } from "lucide-react" // Import icons for the UI
import { getFullName } from "../lib/display" // Import the getFullName utility for displaying student names

// Type definition for geolocation coordinates
type Geo = { latitude: number; longitude: number }

// Async function that requests the user's current geolocation from the browser
async function getLocation(): Promise<Geo> {
  return new Promise((resolve, reject) => { // Return a promise that resolves with coordinates or rejects with an error
    navigator.geolocation.getCurrentPosition( // Request the current position from the browser's Geolocation API
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }), // Resolve with the latitude and longitude from the position
      (err) => reject(err) // Reject with the GeolocationPositionError if access is denied or unavailable
    )
  })
}

// The attendance tracking page component
export function AttendancePage() {
  const [status, setStatus] = useState<{ message: string; variant: "success" | "danger" } | null>(null) // State for the inline status alert message (null = no message)
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PRESENT" | "LATE" | "ABSENT">("ALL") // State for the attendance history filter, defaults to showing all statuses
  const attendanceQuery = useQuery({ // Fetch the attendance records list
    queryKey: ["attendance"], // Cache key for the attendance list
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/attendance"), // Fetch all attendance records from the API
    refetchInterval: 5000 // Auto-refetch every 5 seconds to keep the list current
  })

  const checkInMutation = useMutation({ // Mutation for the check-in action
    mutationFn: (payload: Geo) => // Function that sends the geolocation payload to the check-in endpoint
      apiRequest<ApiResponse<any>>("/api/attendance/check-in", { method: "POST", body: JSON.stringify(payload) }), // POST the coordinates to the check-in endpoint
    onSuccess: () => {
      attendanceQuery.refetch() // Refresh the attendance list after check-in
      toast.success("Checked in") // Show success notification
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Check in failed") // Show error notification
    }
  })

  const checkOutMutation = useMutation({ // Mutation for the check-out action
    mutationFn: (payload: Geo) => // Function that sends the geolocation payload to the check-out endpoint
      apiRequest<ApiResponse<any>>("/api/attendance/check-out", { method: "POST", body: JSON.stringify(payload) }), // POST the coordinates to the check-out endpoint
    onSuccess: () => {
      attendanceQuery.refetch() // Refresh the attendance list after check-out
      toast.success("Checked out") // Show success notification
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Check out failed") // Show error notification
    }
  })

  const handleCheckIn = async () => { // Async handler for the check-in button
    try {
      const geo = await getLocation() // Request the user's current location
      await checkInMutation.mutateAsync(geo) // Send the location to the check-in endpoint
      setStatus({ message: "Checked in successfully", variant: "success" }) // Show inline success message
    } catch {
      setStatus({ message: "Unable to access location", variant: "danger" }) // Show inline error if location access failed
    }
  }

  const handleCheckOut = async () => { // Async handler for the check-out button
    try {
      const geo = await getLocation() // Request the user's current location
      await checkOutMutation.mutateAsync(geo) // Send the location to the check-out endpoint
      setStatus({ message: "Checked out successfully", variant: "success" }) // Show inline success message
    } catch {
      setStatus({ message: "Unable to access location", variant: "danger" }) // Show inline error if location access failed
    }
  }
  const rows = attendanceQuery.data?.data ?? [] // Extract the attendance records array, defaulting to empty array

  const today = new Date() // Get the current date
  today.setHours(0, 0, 0, 0) // Normalize to midnight to compare dates without time

  const todayRecord = rows.find((record: any) => { // Find the attendance record for today
    if (!record.date) return false // Skip records without a date
    const recordDate = new Date(record.date) // Parse the record's date
    recordDate.setHours(0, 0, 0, 0) // Normalize to midnight for comparison
    return recordDate.getTime() === today.getTime() // Compare timestamps to find today's record
  }) as any | undefined

  const latestRecord = (rows[0] as any | undefined) ?? todayRecord // Use the most recent record (first in array) or today's record as fallback

  const lastCheckIn =
    latestRecord && latestRecord.checkInAt ? new Date(latestRecord.checkInAt).toLocaleTimeString() : null // Format the last check-in time or null if not available
  const lastCheckOut =
    latestRecord && latestRecord.checkOutAt ? new Date(latestRecord.checkOutAt).toLocaleTimeString() : null // Format the last check-out time or null if not available

  const verificationMethod = latestRecord ? "Geolocation" : "Not recorded" // Show the verification method or "Not recorded" if no record exists

  const filteredRows =
    statusFilter === "ALL" ? rows : rows.filter((record: any) => record.status === statusFilter) // Filter rows by the selected status, or show all if "ALL" is selected

  const columns = [ // Column definitions for the responsive table
    {
      header: "Student", // Column header
      cell: (record: any) => ( // Render the student's name and email
        <div className="leading-tight">
          <p className="text-sm font-medium text-slate-800">{getFullName(record.user)}</p> {/* Student's full name using the display utility */}
          {record.user?.email && ( // Only show email if available
            <p className="text-xs text-slate-400">{record.user.email}</p> // Student's email in muted text
          )}
        </div>
      ),
    },
    {
      header: "Date", // Column header
      cell: (record: any) => new Date(record.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }), // Format the attendance date
    },
    {
      header: "Status", // Column header
      cell: (record: any) => <StatusBadge status={record.status} />, // Render PRESENT/LATE/ABSENT as a colored status badge
    },
    {
      header: "Check In", // Column header
      cell: (record: any) => (record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString() : "—"), // Format check-in time or show em dash
    },
    {
      header: "Check Out", // Column header
      cell: (record: any) => (record.checkOutAt ? new Date(record.checkOutAt).toLocaleTimeString() : "—"), // Format check-out time or show em dash
    },
    {
      header: "Location", // Column header
      cell: (record: any) => { // Render a Google Maps link if coordinates are available
        if (record.latitude && record.longitude) { // Only render if both coordinates exist
          const mapsUrl = `https://www.google.com/maps?q=${record.latitude},${record.longitude}` // Build the Google Maps URL with the coordinates
          return (
            <div className="flex flex-col gap-1"> {/* Vertical stack for the link and coordinates */}
              <a
                href={mapsUrl} // Link to Google Maps
                target="_blank" // Open in a new tab
                rel="noopener noreferrer" // Security: prevent the new tab from accessing the opener
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline" // Blue link with hover underline
              >
                <MapPin className="h-3 w-3" /> {/* Small map pin icon */}
                View on Map
              </a>
              <span className="text-[10px] text-slate-400 font-mono"> {/* Monospace coordinates in small muted text */}
                {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)} {/* Display coordinates to 6 decimal places */}
              </span>
            </div>
          )
        }
        return <span className="text-xs text-slate-400">—</span> // Show em dash if no coordinates
      },
    },
  ]

  return (
    <div className="space-y-6"> {/* Vertical stack with spacing between sections */}
      <PageHeader
        title="Attendance"
        description="Log participation using device geolocation today and prepare for biometric verification."
        actions={ // Status badges in the page header
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1 text-xs"> {/* Logging enabled badge */}
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {/* Green check icon */}
              <span>Logging enabled</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-xs"> {/* Location required badge */}
              <MapPin className="h-3 w-3 text-slate-500" /> {/* Map pin icon */}
              <span>Location required</span>
            </Badge>
          </div>
        }
      />
      <Card className="border-slate-200/80 bg-white/80 shadow-sm"> {/* Today's status card with semi-transparent background */}
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"> {/* Card content: stacked on mobile, row on desktop */}
          <div> {/* Left section: today's status */}
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Today</div> {/* "Today" label */}
            <div className="mt-2"> {/* Status badge container */}
              {todayRecord ? ( // Show today's status badge if a record exists
                <StatusBadge status={todayRecord.status} />
              ) : (
                <Badge variant="outline">Not checked in</Badge> // Show "Not checked in" if no record for today
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500"> {/* Right section: check-in/out times and verification method */}
            <div className="flex items-center gap-2"> {/* Check-in time row */}
              <Clock className="h-3 w-3" /> {/* Clock icon */}
              <span>Last check-in: {lastCheckIn ?? "—"}</span> {/* Last check-in time or em dash */}
            </div>
            <div className="flex items-center gap-2"> {/* Check-out time row */}
              <Clock className="h-3 w-3" /> {/* Clock icon */}
              <span>Last check-out: {lastCheckOut ?? "—"}</span> {/* Last check-out time or em dash */}
            </div>
            <div className="flex items-center gap-2"> {/* Verification method row */}
              <MapPin className="h-3 w-3" /> {/* Map pin icon */}
              <span>Verification: {verificationMethod}</span> {/* Verification method text */}
            </div>
            {latestRecord?.latitude && latestRecord?.longitude && ( // Only show the location link if coordinates exist
              <div className="flex items-center gap-2"> {/* Location link row */}
                <MapPin className="h-3 w-3 text-blue-600" /> {/* Blue map pin icon */}
                <a
                  href={`https://www.google.com/maps?q=${latestRecord.latitude},${latestRecord.longitude}`} // Google Maps link
                  target="_blank" // Open in new tab
                  rel="noopener noreferrer" // Security attribute
                  className="text-blue-600 hover:text-blue-700 hover:underline" // Blue link with hover underline
                >
                  View Location
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"> {/* Two-column grid for the check-in and facial recognition cards */}
        <SectionCard
          title="Geolocation Attendance"
          description="Use your device location to log attendance."
          actions={ // Badge indicating this is the core method
            <Badge variant="info" className="text-xs">
              Core method
            </Badge>
          }
        >
          <div className="space-y-4"> {/* Vertical stack inside the card */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"> {/* Info row */}
              <div className="flex items-center gap-2"> {/* Location access instruction */}
                <MapPin className="h-3 w-3" /> {/* Map pin icon */}
                <span>Allow location access in your browser to enable check-in.</span>
              </div>
              {latestRecord && ( // Only show the latest status if a record exists
                <div className="flex items-center gap-2"> {/* Latest status row */}
                  <AlertTriangle className="h-3 w-3 text-amber-500" /> {/* Warning icon */}
                  <span>
                    Latest status:{" "}
                    <span className="font-medium text-slate-700">{latestRecord.status}</span> {/* Bold status text */}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2"> {/* Row of check-in/out buttons */}
              <Button onClick={handleCheckIn} disabled={checkInMutation.isPending} className="flex items-center gap-2"> {/* Check-in button */}
                <CheckCircle2 className="h-4 w-4" /> {/* Check circle icon */}
                <span>{checkInMutation.isPending ? "Checking in..." : "Check In"}</span> {/* Loading text while checking in */}
              </Button>
              <Button
                onClick={handleCheckOut}
                variant="outline" // Outline style for the secondary action
                disabled={checkOutMutation.isPending} // Disable while checking out
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" /> {/* Clock icon */}
                <span>{checkOutMutation.isPending ? "Checking out..." : "Check Out"}</span> {/* Loading text while checking out */}
              </Button>
            </div>
            {status && <Alert variant={status.variant}>{status.message}</Alert>} {/* Show inline status alert if set */}
          </div>
        </SectionCard>
        <SectionCard
          title="Facial Recognition Attendance"
          description="Future-ready verification workflow placeholder."
          actions={ // Badge indicating this is a placeholder
            <Badge variant="outline" className="text-xs">
              Placeholder
            </Badge>
          }
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center"> {/* Stacked on mobile, row on desktop */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/5 text-slate-700"> {/* Camera icon container */}
              <Camera className="h-6 w-6" /> {/* Camera icon */}
            </div>
            <div className="flex-1 space-y-2"> {/* Description text block */}
              <p className="text-sm text-slate-600">
                This section is reserved for future facial recognition integration, aligned with your institution&apos;s
                verification provider.
              </p>
              <p className="text-xs text-slate-500">
                Use the simulation flow during development to validate audit logs and attendance state changes before
                connecting a live biometric service.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end"> {/* Simulate button and disclaimer */}
              <Button variant="secondary" className="flex items-center gap-2"> {/* Simulate verification button */}
                <CheckCircle2 className="h-4 w-4" /> {/* Check circle icon */}
                <span>Simulate Verification</span>
              </Button>
              <p className="max-w-[220px] text-xs text-slate-500"> {/* Disclaimer text */}
                No biometric data is processed yet. This is a safe placeholder for integration.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
      <SectionCard
        title="Attendance History"
        description="Review recent attendance activity."
        actions={ // Filter dropdown and refresh button in the card header
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter} // Controlled select value
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | "PRESENT" | "LATE" | "ABSENT")} // Update filter state on change
              className="h-9 w-[160px]" // Fixed width select
            >
              <option value="ALL">All statuses</option> {/* Show all records */}
              <option value="PRESENT">Present</option> {/* Filter to present only */}
              <option value="LATE">Late</option> {/* Filter to late only */}
              <option value="ABSENT">Absent</option> {/* Filter to absent only */}
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => attendanceQuery.refetch()} // Manually refresh the attendance list
            >
              Refresh
            </Button>
          </div>
        }
      >
        {attendanceQuery.isError && <Alert variant="danger">Unable to load attendance history.</Alert>} {/* Error alert if fetch failed */}
        {attendanceQuery.isLoading ? ( // Show loading skeleton while fetching
          <LoadingSkeleton rows={3} columns={4} /> // Skeleton matching the table structure
        ) : rows.length === 0 ? ( // Show empty state if no records exist
          <EmptyState title="No attendance records" description="Check in to start building your history." />
        ) : filteredRows.length === 0 ? ( // Show empty state if the filter returns no results
          <EmptyState
            title="No records for this status"
            description="Try selecting a different attendance status filter."
          />
        ) : (
          <ResponsiveTableCards
            data={filteredRows} // Pass the filtered records as data
            columns={columns} // Pass the column definitions
            rowKey={(record) => record.id} // Use the record ID as the React key
            renderTitle={(record) => new Date(record.date).toLocaleDateString()} // Use the formatted date as the card title on mobile
          />
        )}
      </SectionCard>
    </div>
  )
}
