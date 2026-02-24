import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { PageHeader } from "../components/ui/page-header"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { toast } from "sonner"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { Camera, CameraOff, Video, VideoOff } from "lucide-react"

export function ExamsPage() {
  const [timeLeft, setTimeLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const sessionsQuery = useQuery({
    queryKey: ["exams"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/exams"),
    refetchInterval: 5000
  })

  const attemptMutation = useMutation({
    mutationFn: (examSessionId: string) =>
      apiRequest<ApiResponse<any>>("/api/exams/attempts", {
        method: "POST",
        body: JSON.stringify({ examSessionId })
      }),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to start exam")
    }
  })

  useEffect(() => {
    if (!running || timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [running, timeLeft])

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraEnabled(true)
        toast.success("Camera enabled successfully")
      }
    } catch (error) {
      console.error("Camera error:", error)
      let errorMessage = "Unable to access camera"
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMessage = "Camera permission denied. Please allow camera access in your browser settings."
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          errorMessage = "No camera found. Please connect a camera and try again."
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          errorMessage = "Camera is already in use by another application."
        }
      }
      
      setCameraError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraEnabled(false)
    toast.info("Camera disabled")
  }

  const startExam = async (durationMin: number, examSessionId: string) => {
    if (!cameraEnabled) {
      toast.error("Please enable camera before starting the exam")
      return
    }
    
    setTimeLeft(durationMin * 60)
    setRunning(true)
    await attemptMutation.mutateAsync(examSessionId)
    toast.success("Exam started")
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const rows = sessionsQuery.data?.data ?? []
  const columns = [
    {
      header: "Title",
      cell: (session: any) => <span className="font-medium text-slate-900">{session.title}</span>
    },
    {
      header: "Schedule",
      cell: (session: any) => new Date(session.scheduledAt).toLocaleString()
    },
    {
      header: "Duration",
      cell: (session: any) => `${session.durationMin} mins`
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Exams" description="Monitor sessions and launch supervised exams" />
      
      <SectionCard title="Exam Monitoring" description="Enable camera for proctored exam sessions">
        <div className="space-y-4">
          {/* Camera Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {!cameraEnabled ? (
              <Button onClick={startCamera} className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Enable Camera
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="outline" className="flex items-center gap-2">
                <CameraOff className="h-4 w-4" />
                Disable Camera
              </Button>
            )}
            
            {running && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 border border-slate-200">
                <Video className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Time Remaining: {formatTime(Math.max(timeLeft, 0))}
                </span>
              </div>
            )}
            
            {cameraEnabled && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold text-green-700">Camera Active</span>
              </div>
            )}
          </div>

          {/* Camera Error */}
          {cameraError && (
            <Alert variant="danger">
              {cameraError}
            </Alert>
          )}

          {/* Video Preview */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 border-2 border-slate-200">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="h-full w-full object-cover"
            />
            {!cameraEnabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white">
                <VideoOff className="h-16 w-16 mb-4 text-slate-600" />
                <p className="text-sm font-medium text-slate-400">Camera is disabled</p>
                <p className="text-xs text-slate-500 mt-1">Click "Enable Camera" to start</p>
              </div>
            )}
          </div>

          {/* Anti-cheat Notice */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-900">Anti-Cheat Guidelines</h4>
                <ul className="mt-2 text-xs text-amber-800 space-y-1">
                  <li>• Keep your camera enabled throughout the exam</li>
                  <li>• Do not switch tabs or minimize the browser</li>
                  <li>• Ensure you are in a well-lit, quiet environment</li>
                  <li>• Keep your face visible in the camera frame</li>
                </ul>
              </div>
            </div>
          </div>

          {attemptMutation.isError && (
            <Alert variant="danger">
              Unable to start the exam attempt. Please try again.
            </Alert>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Exam Sessions" description="Upcoming sessions and availability">
        {sessionsQuery.isError && <Alert variant="danger">Unable to load exam sessions.</Alert>}
        {sessionsQuery.isLoading ? (
          <LoadingSkeleton rows={3} columns={3} />
        ) : rows.length === 0 ? (
          <EmptyState title="No exam sessions scheduled" description="Create an exam session to begin monitoring." />
        ) : (
          <ResponsiveTableCards
            data={rows}
            columns={columns}
            rowKey={(session) => session.id}
            renderTitle={(session) => session.title}
            renderActions={(session) => (
              <Button 
                size="sm" 
                onClick={() => startExam(session.durationMin, session.id)}
                disabled={!cameraEnabled || running}
              >
                {running ? "In Progress" : "Start Exam"}
              </Button>
            )}
          />
        )}
      </SectionCard>
    </div>
  )
}
