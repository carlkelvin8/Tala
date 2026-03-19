import { useEffect, useRef, useState } from "react" // Import useEffect for timer/cleanup side effects, useRef for video/stream refs, useState for local state
import { useMutation, useQuery } from "@tanstack/react-query" // Import useMutation for starting exam attempts and useQuery for fetching exam sessions
import { apiRequest } from "../lib/api" // Import the generic API request helper
import { ApiResponse } from "../types" // Import the generic API response wrapper type
import { Button } from "../components/ui/button" // Import the reusable Button component
import { PageHeader } from "../components/ui/page-header" // Import the PageHeader component
import { Alert } from "../components/ui/alert" // Import the Alert component for error messages
import { EmptyState } from "../components/ui/empty-state" // Import the EmptyState component for empty list state
import { toast } from "sonner" // Import toast for notifications
import { SectionCard } from "../components/ui/section-card" // Import the SectionCard wrapper for sections
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards" // Import the responsive table/card component
import { LoadingSkeleton } from "../components/ui/loading-skeleton" // Import the loading skeleton
import { Camera, CameraOff, Video, VideoOff } from "lucide-react" // Import icons: Camera/CameraOff for toggle, Video/VideoOff for status

// The exams page component with camera-based proctoring
export function ExamsPage() {
  const [timeLeft, setTimeLeft] = useState(0) // State for the countdown timer in seconds
  const [running, setRunning] = useState(false) // State for whether an exam is currently in progress
  const [cameraEnabled, setCameraEnabled] = useState(false) // State for whether the camera is currently active
  const [cameraError, setCameraError] = useState<string | null>(null) // State for camera error messages (null = no error)
  const videoRef = useRef<HTMLVideoElement | null>(null) // Ref to the video element for displaying the camera feed
  const streamRef = useRef<MediaStream | null>(null) // Ref to the MediaStream for cleanup when the component unmounts

  const sessionsQuery = useQuery({ // Fetch the list of exam sessions
    queryKey: ["exams"], // Cache key for the exams list
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/exams"), // Fetch all exam sessions from the API
    refetchInterval: 5000 // Auto-refetch every 5 seconds
  })

  const attemptMutation = useMutation({ // Mutation for starting an exam attempt
    mutationFn: (examSessionId: string) => // Function that sends the exam session ID to start an attempt
      apiRequest<ApiResponse<any>>("/api/exams/attempts", { // POST to the exam attempts endpoint
        method: "POST",
        body: JSON.stringify({ examSessionId }) // Send the exam session ID as JSON
      }),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to start exam") // Show error notification if attempt fails
    }
  })

  useEffect(() => { // Effect for the countdown timer
    if (!running || timeLeft <= 0) return // Don't start the timer if the exam isn't running or time has run out
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000) // Decrement the timer by 1 every second
    return () => clearInterval(timer) // Cleanup: clear the interval when the effect re-runs or the component unmounts
  }, [running, timeLeft]) // Re-run when running state or timeLeft changes

  // Cleanup camera stream on unmount
  useEffect(() => { // Effect for cleaning up the camera stream when the component unmounts
    return () => { // Cleanup function runs when the component unmounts
      if (streamRef.current) { // Only cleanup if a stream exists
        streamRef.current.getTracks().forEach(track => track.stop()) // Stop all tracks in the stream to release the camera
      }
    }
  }, []) // Empty dependency array: only runs on mount/unmount

  const startCamera = async () => { // Async handler to request camera access and start the video feed
    try {
      setCameraError(null) // Clear any previous camera error
      const stream = await navigator.mediaDevices.getUserMedia({ // Request camera access from the browser
        video: { 
          width: { ideal: 1280 }, // Request 1280px width (ideal, not required)
          height: { ideal: 720 } // Request 720px height (ideal, not required)
        } 
      })
      
      if (videoRef.current) { // Only proceed if the video element is mounted
        videoRef.current.srcObject = stream // Attach the camera stream to the video element
        streamRef.current = stream // Store the stream ref for cleanup
        setCameraEnabled(true) // Update state to indicate camera is active
        toast.success("Camera enabled successfully") // Show success notification
      }
    } catch (error) {
      console.error("Camera error:", error) // Log the error for debugging
      let errorMessage = "Unable to access camera" // Default error message
      
      if (error instanceof Error) { // Check for specific error types to provide helpful messages
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMessage = "Camera permission denied. Please allow camera access in your browser settings." // Permission denied error
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          errorMessage = "No camera found. Please connect a camera and try again." // No camera hardware found
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          errorMessage = "Camera is already in use by another application." // Camera in use by another app
        }
      }
      
      setCameraError(errorMessage) // Set the error message in state for display
      toast.error(errorMessage) // Show error notification
    }
  }

  const stopCamera = () => { // Handler to stop the camera and release the stream
    if (streamRef.current) { // Only stop if a stream exists
      streamRef.current.getTracks().forEach(track => track.stop()) // Stop all tracks to release the camera hardware
      streamRef.current = null // Clear the stream ref
    }
    if (videoRef.current) { // Only clear if the video element is mounted
      videoRef.current.srcObject = null // Remove the stream from the video element
    }
    setCameraEnabled(false) // Update state to indicate camera is inactive
    toast.info("Camera disabled") // Show info notification
  }

  const startExam = async (durationMin: number, examSessionId: string) => { // Async handler to start an exam session
    if (!cameraEnabled) { // Require camera to be enabled before starting
      toast.error("Please enable camera before starting the exam") // Show error if camera is not enabled
      return // Exit early
    }
    
    setTimeLeft(durationMin * 60) // Convert duration from minutes to seconds for the countdown timer
    setRunning(true) // Set the exam as running
    await attemptMutation.mutateAsync(examSessionId) // Create the exam attempt record in the backend
    toast.success("Exam started") // Show success notification
  }

  const formatTime = (seconds: number) => { // Helper function to format seconds as MM:SS
    const mins = Math.floor(seconds / 60) // Calculate the number of complete minutes
    const secs = seconds % 60 // Calculate the remaining seconds
    return `${mins}:${secs.toString().padStart(2, '0')}` // Format as "M:SS" with zero-padded seconds
  }

  const rows = sessionsQuery.data?.data ?? [] // Extract the exam sessions array, defaulting to empty array
  const columns = [ // Column definitions for the responsive table
    {
      header: "Title", // Column header
      cell: (session: any) => <span className="font-medium text-slate-900">{session.title}</span> // Render the exam title in bold dark text
    },
    {
      header: "Schedule", // Column header
      cell: (session: any) => new Date(session.scheduledAt).toLocaleString() // Format the scheduled date and time
    },
    {
      header: "Duration", // Column header
      cell: (session: any) => `${session.durationMin} mins` // Render the duration in minutes
    }
  ]

  return (
    <div className="space-y-6"> {/* Vertical stack with spacing between sections */}
      <PageHeader title="Exams" description="Monitor sessions and launch supervised exams" /> {/* Page title and description */}
      
      <SectionCard title="Exam Monitoring" description="Enable camera for proctored exam sessions"> {/* Camera monitoring card */}
        <div className="space-y-4"> {/* Vertical stack inside the card */}
          {/* Camera Controls */}
          <div className="flex flex-wrap items-center gap-3"> {/* Row of camera control elements */}
            {!cameraEnabled ? ( // Show enable button when camera is off
              <Button onClick={startCamera} className="flex items-center gap-2"> {/* Enable camera button */}
                <Camera className="h-4 w-4" /> {/* Camera icon */}
                Enable Camera
              </Button>
            ) : ( // Show disable button when camera is on
              <Button onClick={stopCamera} variant="outline" className="flex items-center gap-2"> {/* Disable camera button */}
                <CameraOff className="h-4 w-4" /> {/* Camera off icon */}
                Disable Camera
              </Button>
            )}
            
            {running && ( // Only show the timer when an exam is running
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 border border-slate-200"> {/* Timer display container */}
                <Video className="h-4 w-4 text-slate-600" /> {/* Video icon */}
                <span className="text-sm font-semibold text-slate-900"> {/* Timer text */}
                  Time Remaining: {formatTime(Math.max(timeLeft, 0))} {/* Format the remaining time, clamped to 0 */}
                </span>
              </div>
            )}
            
            {cameraEnabled && ( // Only show the active indicator when camera is on
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200"> {/* Green active indicator */}
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> {/* Pulsing green dot */}
                <span className="text-xs font-semibold text-green-700">Camera Active</span> {/* Active label */}
              </div>
            )}
          </div>

          {/* Camera Error */}
          {cameraError && ( // Only show the error alert if there's a camera error
            <Alert variant="danger">
              {cameraError} {/* Display the camera error message */}
            </Alert>
          )}

          {/* Video Preview */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 border-2 border-slate-200"> {/* 16:9 aspect ratio video container */}
            <video 
              ref={videoRef} // Attach the ref to control the video element programmatically
              autoPlay // Automatically play the stream when srcObject is set
              playsInline // Prevent fullscreen on iOS
              muted // Mute the video to prevent audio feedback
              className="h-full w-full object-cover" // Fill the container and cover the area
            />
            {!cameraEnabled && ( // Show the disabled overlay when camera is off
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white"> {/* Full overlay with centered content */}
                <VideoOff className="h-16 w-16 mb-4 text-slate-600" /> {/* Large video-off icon */}
                <p className="text-sm font-medium text-slate-400">Camera is disabled</p> {/* Status text */}
                <p className="text-xs text-slate-500 mt-1">Click "Enable Camera" to start</p> {/* Instruction text */}
              </div>
            )}
          </div>

          {/* Anti-cheat Notice */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4"> {/* Amber warning box for anti-cheat guidelines */}
            <div className="flex gap-3"> {/* Row with icon and text */}
              <div className="flex-shrink-0"> {/* Icon container that doesn't shrink */}
                <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20"> {/* Warning triangle SVG icon */}
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /> {/* Warning triangle path */}
                </svg>
              </div>
              <div> {/* Text content block */}
                <h4 className="text-sm font-semibold text-amber-900">Anti-Cheat Guidelines</h4> {/* Section title */}
                <ul className="mt-2 text-xs text-amber-800 space-y-1"> {/* Bulleted list of guidelines */}
                  <li>• Keep your camera enabled throughout the exam</li> {/* Guideline 1 */}
                  <li>• Do not switch tabs or minimize the browser</li> {/* Guideline 2 */}
                  <li>• Ensure you are in a well-lit, quiet environment</li> {/* Guideline 3 */}
                  <li>• Keep your face visible in the camera frame</li> {/* Guideline 4 */}
                </ul>
              </div>
            </div>
          </div>

          {attemptMutation.isError && ( // Show error alert if starting the exam attempt failed
            <Alert variant="danger">
              Unable to start the exam attempt. Please try again.
            </Alert>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Exam Sessions" description="Upcoming sessions and availability"> {/* Card for the exam sessions list */}
        {sessionsQuery.isError && <Alert variant="danger">Unable to load exam sessions.</Alert>} {/* Error alert if fetch failed */}
        {sessionsQuery.isLoading ? ( // Show loading skeleton while fetching
          <LoadingSkeleton rows={3} columns={3} /> // Skeleton matching the table structure
        ) : rows.length === 0 ? ( // Show empty state if no sessions exist
          <EmptyState title="No exam sessions scheduled" description="Create an exam session to begin monitoring." />
        ) : (
          <ResponsiveTableCards
            data={rows} // Pass the exam sessions array as data
            columns={columns} // Pass the column definitions
            rowKey={(session) => session.id} // Use the session ID as the React key
            renderTitle={(session) => session.title} // Use the exam title as the card title on mobile
            renderActions={(session) => ( // Render the start exam button for each session
              <Button 
                size="sm" 
                onClick={() => startExam(session.durationMin, session.id)} // Start the exam with this session's duration and ID
                disabled={!cameraEnabled || running} // Disable if camera is off or an exam is already running
              >
                {running ? "In Progress" : "Start Exam"} {/* Show "In Progress" if an exam is running */}
              </Button>
            )}
          />
        )}
      </SectionCard>
    </div>
  )
}
