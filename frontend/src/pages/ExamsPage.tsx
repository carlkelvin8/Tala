import { useEffect, useRef, useState, useCallback } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { cn } from "../lib/utils"
import { Button } from "../components/ui/button"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { toast } from "sonner"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { FileText, Sparkles, Camera, CameraOff, Video, VideoOff, Clock, Shield, AlertTriangle, Eye, Monitor, Smartphone } from "lucide-react"
import { motion } from "framer-motion"

export function ExamsPage() {
  const [timeLeft, setTimeLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null)

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

  useEffect(() => {
    if (running && timeLeft <= 0 && currentAttemptId) {
      setRunning(false)
      toast.warning("Time's up! Auto-submitting your exam...")
      apiRequest(`/api/exams/attempts/${currentAttemptId}/finish`, { method: "POST" })
        .then(() => {
          toast.success("Exam submitted successfully")
          setCurrentAttemptId(null)
          sessionsQuery.refetch()
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Failed to submit exam")
        })
    }
  }, [timeLeft, running, currentAttemptId])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const ensureCameraActive = useCallback(async () => {
    if (streamRef.current && streamRef.current.active) {
      if (videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = streamRef.current
      }
      return true
    }
    return false
  }, [])

  const startCamera = async () => {
    try {
      setCameraError(null)
      if (streamRef.current && streamRef.current.active) {
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current
        }
        setCameraEnabled(true)
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraEnabled(true)
      toast.success("Camera enabled successfully")
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

  useEffect(() => {
    if (!videoRef.current || !streamRef.current) return
    const video = videoRef.current
    const stream = streamRef.current
    if (video.srcObject !== stream) {
      video.srcObject = stream
    }
    const handleTrackEnded = () => {
      setCameraEnabled(false)
      setCameraError("Camera stream was interrupted. Please re-enable the camera.")
    }
    stream.getTracks().forEach(track => {
      track.addEventListener("ended", handleTrackEnded)
    })
    return () => {
      stream.getTracks().forEach(track => {
        track.removeEventListener("ended", handleTrackEnded)
      })
    }
  }, [cameraEnabled])

  const startExam = async (durationMin: number, examSessionId: string) => {
    if (!cameraEnabled) {
      toast.error("Please enable camera before starting the exam")
      return
    }
    const isActive = await ensureCameraActive()
    if (!isActive) {
      toast.error("Camera is not active. Please re-enable it.")
      setCameraEnabled(false)
      return
    }
    try {
      const result = await attemptMutation.mutateAsync(examSessionId)
      setCurrentAttemptId(result.data?.id ?? null)
      setTimeLeft(durationMin * 60)
      setRunning(true)
      toast.success("Exam started — timer is now counting down")
    } catch {
    }
  }

  const finishExam = async () => {
    if (!currentAttemptId) return
    try {
      await apiRequest(`/api/exams/attempts/${currentAttemptId}/finish`, { method: "POST" })
      toast.success("Exam submitted successfully")
      setCurrentAttemptId(null)
      setRunning(false)
      sessionsQuery.refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit exam")
    }
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
      cell: (session: any) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-royal/10">
            <FileText className="h-4 w-4 text-royal" />
          </div>
          <span className="font-semibold text-black">{session.title}</span>
        </div>
      )
    },
    {
      header: "Schedule",
      cell: (session: any) => (
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-darksilver" />
          <span className="text-sm text-darksilver">{new Date(session.scheduledAt).toLocaleString()}</span>
        </div>
      )
    },
    {
      header: "Duration",
      cell: (session: any) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-silver/20 px-2.5 py-1 text-xs font-medium text-black/80">
          <Clock className="h-3 w-3" />
          {session.durationMin} mins
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-10 py-8 shadow-card"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <motion.div
          className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.18, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-royal/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <motion.div
            className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20"
            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <motion.div
              className="flex items-center gap-2 text-gold text-xs font-medium uppercase tracking-wider mb-1.5"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <motion.span animate={{ rotate: [0, 20, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}>
                <Sparkles className="h-3.5 w-3.5" />
              </motion.span>
              <span>Exam Proctoring</span>
            </motion.div>
            <motion.h1
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Exams
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-silver max-w-2xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Monitor sessions and launch supervised exams with camera-based proctoring.
            </motion.p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
      >
      <SectionCard title="Exam Monitoring" description="Enable camera for proctored exam sessions" className="shadow-card">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {!cameraEnabled ? (
              <Button onClick={startCamera} className="flex items-center gap-2 bg-gradient-to-r from-navy to-royal hover:from-royal hover:to-navy text-white">
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
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-royal/10 px-4 py-1.5">
                <Video className="h-4 w-4 text-royal" />
                <span className="text-sm font-semibold text-royal">
                  Time Remaining: {formatTime(Math.max(timeLeft, 0))}
                </span>
              </div>
            )}

            {running && currentAttemptId && (
              <Button onClick={finishExam} variant="outline" className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50">
                Submit Exam
              </Button>
            )}

            {cameraEnabled && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold text-green-700">Camera Active</span>
              </div>
            )}

            {running && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                <Shield className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">Proctoring Active</span>
              </div>
            )}
          </div>

          {cameraError && (
            <Alert variant="danger">
              {cameraError}
            </Alert>
          )}

          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-navy border-2 border-silver/30">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {!cameraEnabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy text-white">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-royal/80 ring-1 ring-white/10 mb-4">
                  <VideoOff className="h-8 w-8 text-darksilver" />
                </div>
                <p className="text-sm font-medium text-silver">Camera is disabled</p>
                <p className="text-xs text-darksilver mt-1">Click "Enable Camera" to start</p>
              </div>
            )}
            {cameraEnabled && running && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">REC</span>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-5">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-900">Anti-Cheat Guidelines</h4>
                <ul className="mt-2 text-xs text-amber-800 space-y-1">
                  <li>• Keep your camera enabled throughout the entire exam</li>
                  <li>• Do not switch tabs or minimize the browser</li>
                  <li>• Ensure you are in a well-lit, quiet environment</li>
                  <li>• Keep your face visible in the camera frame at all times</li>
                  <li>• The camera feed is continuously monitored during the exam</li>
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

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
      >
      <SectionCard title="Exam Sessions" description="Upcoming sessions and availability" className="shadow-card">
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
      </motion.div>
      </motion.div>
    </div>
  )
}
