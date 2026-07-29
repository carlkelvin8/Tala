import { useQuery, useMutation } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { StatusBadge } from "../components/ui/status-badge"
import { toast } from "sonner"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { Badge } from "../components/ui/badge"
import { QrCode, Timer, ScanLine, CheckCircle2, XCircle, Camera, Sparkles, Clock, UserCheck, UserX, Eye } from "lucide-react"
import { getFullName } from "../lib/display"
import { getStoredUser } from "../lib/auth"
import { QRCodeSVG } from "qrcode.react"
import { cn } from "../lib/utils"
import { motion } from "framer-motion"
import {
  MotionHero,
  MotionCardGrid,
  MotionCard,
  MotionSection,
  MotionScalePop,
  cardContainerVariants,
  cardItemVariants,
} from "../components/ui/page-transition"

declare class BarcodeDetector {
  constructor(options?: { formats?: string[] })
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>
}

const ATTENDANCE_STATUSES = ["ALL", "PRESENT", "LATE", "ABSENT"] as const

const statusMeta: Record<string, { label: string; color: string; bg: string; dot: string; icon: typeof CheckCircle2 }> = {
  PRESENT: { label: "Present", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500", icon: CheckCircle2 },
  LATE:    { label: "Late",    color: "text-amber-600",  bg: "bg-amber-50",   dot: "bg-amber-500", icon: Clock },
  ABSENT:  { label: "Absent",  color: "text-red-600",    bg: "bg-red-50",     dot: "bg-red-500",   icon: UserX },
}

export function AttendancePage() {
  const user = getStoredUser()
  const isScanner = user?.role === "ADMIN" || user?.role === "IMPLEMENTOR"

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-10 py-8 shadow-elevated"
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
          animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <motion.div
            className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20"
            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <QrCode className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
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
              <span>QR Attendance System</span>
            </motion.div>
            <motion.h1
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
            >
              QR Attendance
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-silver max-w-2xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36, ease: [0.16, 1, 0.3, 1] as const }}
            >
              {isScanner
                ? "Scan student QR codes to record attendance in real time."
                : "Show your QR code to your instructor for attendance."}
            </motion.p>
          </div>
          <motion.div
            className="flex flex-wrap items-center gap-2 shrink-0"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 text-white border-white/20">
              <QrCode className="h-3.5 w-3.5 text-emerald-400" />
              <span>QR-based</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 text-white border-white/20">
              <Timer className="h-3.5 w-3.5 text-sky-400" />
              <span>30s refresh</span>
            </Badge>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] as const }}
      >
        {isScanner ? <ScannerView /> : <StudentQRView />}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <AttendanceHistory />
      </motion.div>
    </div>
  )
}

function StudentQRView() {
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [expiresIn, setExpiresIn] = useState(30)

  const qrQuery = useQuery({
    queryKey: ["qr-token"],
    queryFn: () => apiRequest<ApiResponse<{ token: string; expiresIn: number }>>("/api/attendance/qr-token"),
    refetchInterval: 28_000,
  })

  useEffect(() => {
    if (qrQuery.data?.data) {
      setQrToken(qrQuery.data.data.token)
      setExpiresIn(qrQuery.data.data.expiresIn || 30)
    }
  }, [qrQuery.data])

  useEffect(() => {
    if (expiresIn <= 0) return
    const timer = setInterval(() => {
      setExpiresIn((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [expiresIn])

  // Auto-refetch when countdown reaches zero
  useEffect(() => {
    if (expiresIn <= 0) {
      qrQuery.refetch()
    }
  }, [expiresIn, qrQuery])

  const progress = (expiresIn / 30) * 100

  return (
    <SectionCard title="Your QR Code" description="Show this to your instructor. It refreshes automatically." className="shadow-card">
      <div className="flex flex-col items-center gap-6 py-4">
        {qrQuery.isLoading ? (
          <div className="flex h-[260px] w-[260px] items-center justify-center rounded-2xl bg-white border border-silver/20">
            <LoadingSkeleton rows={1} columns={1} />
          </div>
        ) : qrQuery.isError ? (
          <Alert variant="danger">Unable to load QR code. Please try again.</Alert>
        ) : qrToken ? (
          <>
            <MotionScalePop className="relative rounded-2xl bg-gradient-to-br from-white to-silver/20 p-5 shadow-card ring-1 ring-silver/20">
              <QRCodeSVG value={qrToken} size={220} level="M" />
            </MotionScalePop>
            <div className="w-full max-w-[300px] space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-darksilver">
                  <Timer className="h-3.5 w-3.5" />
                  Refreshes in
                </span>
                <span className="font-mono text-sm font-semibold text-black tabular-nums">{expiresIn}s</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-silver/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </SectionCard>
  )
}

function ScannerView() {
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const scanMutation = useMutation({
    mutationFn: (token: string) =>
      apiRequest<ApiResponse<any>>("/api/attendance/scan", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    onSuccess: (data) => {
      const name = data.data?.student ? getFullName(data.data.student) : "Student"
      setScanResult({ success: true, message: `${name} — marked PRESENT` })
      toast.success("Attendance recorded")
      setTimeout(() => setScanResult(null), 4000)
    },
    onError: (error) => {
      setScanResult({ success: false, message: error instanceof Error ? error.message : "Scan failed" })
      toast.error("Scan failed")
      setTimeout(() => setScanResult(null), 4000)
    },
  })

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }, [])

  const startScanning = useCallback(async () => {
    setIsScanning(true)
    setScanResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setScanResult({ success: false, message: "Camera access denied" })
      setIsScanning(false)
    }
  }, [])

  useEffect(() => {
    if (!isScanning || !videoRef.current) return

    let animFrame: number | null = null
    let stopped = false

    async function init() {
      if (typeof BarcodeDetector !== "undefined") {
        const detector = new BarcodeDetector({ formats: ["qr_code"] })
        async function scanFrame() {
          if (stopped || !videoRef.current) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              scanMutation.mutate(barcodes[0].rawValue)
              stopScanning()
              return
            }
          } catch { /* ignore */ }
          animFrame = requestAnimationFrame(scanFrame)
        }
        scanFrame()
      } else {
        try {
          if (!videoRef.current) return
          const video = videoRef.current
          const QrScanner = (await import("qr-scanner")).default
          const scanner = new QrScanner(
            video,
            (result: { data: string }) => {
              if (result?.data) {
                scanMutation.mutate(result.data)
                stopScanning()
              }
            },
            { returnDetailedScanResult: true }
          )
          await scanner.start()
          if (!stopped) {
            return () => { scanner.stop(); scanner.destroy() }
          }
        } catch {
          setScanResult({ success: false, message: "QR scanner not supported in this browser" })
          stopScanning()
        }
      }
    }

    init()

    return () => {
      stopped = true
      if (animFrame) cancelAnimationFrame(animFrame)
    }
  }, [isScanning])

  useEffect(() => {
    return () => stopScanning()
  }, [])

  return (
    <SectionCard
      title="QR Scanner"
      description="Point camera at student QR code."
      className="shadow-card"
      actions={
        <button
          onClick={isScanning ? stopScanning : startScanning}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 shadow-soft",
            isScanning
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-gradient-to-r from-navy to-royal text-white hover:from-navy hover:to-black"
          )}
        >
          {isScanning ? (
            <>
              <Camera className="h-4 w-4" />
              Stop Scanner
            </>
          ) : (
            <>
              <ScanLine className="h-4 w-4" />
              Open Scanner
            </>
          )}
        </button>
      }
    >
      <div className="flex flex-col items-center gap-4">
        {isScanning && (
          <div className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-silver/30 bg-black shadow-card">
            <video
              ref={videoRef}
              className="w-full"
              playsInline
              muted
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-48 w-48">
                <div className="absolute inset-0 rounded-2xl border-2 border-white/40" />
                <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-white rounded-tl-2xl" />
                <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-white rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 h-8 w-8 border-l-2 border-b-2 border-white rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 h-8 w-8 border-r-2 border-b-2 border-white rounded-br-2xl" />
              </div>
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-4 py-1.5 text-xs text-white/90 backdrop-blur-sm">
                <ScanLine className="h-3 w-3" />
                Point camera at QR code
              </span>
            </div>
          </div>
        )}
        {scanResult && (
          <div className={cn(
            "flex items-center gap-3 rounded-xl border px-5 py-3.5 text-sm shadow-soft animate-scale-in w-full max-w-[400px]",
            scanResult.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}>
            {scanResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{scanResult.message}</span>
          </div>
        )}
        {!isScanning && !scanResult && (
          <div className="flex flex-col items-center gap-3 py-8 text-darksilver">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
              <Camera className="h-7 w-7" strokeWidth={1.25} />
            </span>
            <div className="text-center">
              <p className="text-sm font-medium text-darksilver">Camera is idle</p>
              <p className="text-xs text-darksilver mt-1">Click "Open Scanner" to start scanning student QR codes.</p>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

function AttendanceHistory() {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PRESENT" | "LATE" | "ABSENT">("ALL")

  const attendanceQuery = useQuery({
    queryKey: ["attendance"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/attendance"),
    refetchInterval: 10_000,
  })

  const rows = attendanceQuery.data?.data ?? []

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rows.length, PRESENT: 0, LATE: 0, ABSENT: 0 }
    for (const r of rows) {
      if (counts[r.status] !== undefined) counts[r.status]++
    }
    return counts
  }, [rows])

  const filteredRows = useMemo(() => {
    return statusFilter === "ALL" ? rows : rows.filter((record: any) => record.status === statusFilter)
  }, [rows, statusFilter])

  const columns = [
    {
      header: "Student",
      cell: (record: any) => {
        const profile = record.user?.studentProfile
        const name = getFullName(record.user)
        const initial = profile?.firstName?.[0] ?? record.user?.email?.[0] ?? "?"
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-royal text-xs font-bold text-white shadow-soft shrink-0">
              {initial.toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-black truncate">{name}</p>
              {record.user?.email && (
                <p className="text-xs text-darksilver truncate">{record.user.email}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      header: "Date",
      cell: (record: any) => (
        <span className="text-sm text-darksilver whitespace-nowrap">
          {new Date(record.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (record: any) => <StatusBadge status={record.status} />,
    },
    {
      header: "Scanned At",
      cell: (record: any) => (
        <span className="text-sm text-darksilver whitespace-nowrap">
          {record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—"}
        </span>
      ),
    },
  ]

  return (
    <SectionCard title="Attendance History" description="Recent attendance records." className="shadow-card">
      {rows.length > 0 && (
        <div className="space-y-4">
          <motion.div
            className="grid gap-4 sm:grid-cols-3 px-6 pt-2"
            variants={cardContainerVariants}
            initial="initial"
            animate="animate"
          >
            {(["PRESENT", "LATE", "ABSENT"] as const).map((status) => {
              const meta = statusMeta[status]
              const count = statusCounts[status]
              return (
                <motion.div
                  key={status}
                  variants={cardItemVariants}
                  whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-4 rounded-xl border border-silver/20 bg-white p-4 shadow-card cursor-default"
                >
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0", meta.bg)}>
                    <meta.icon className={cn("h-5 w-5", meta.color)} strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">{meta.label}</p>
                    <motion.p
                      className={cn("text-xl font-bold mt-0.5", meta.color)}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                    >
                      {count}
                    </motion.p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          <div className="flex flex-wrap items-center gap-2 px-6">
            {ATTENDANCE_STATUSES.map((s) => {
              const meta = statusMeta[s]
              const count = statusCounts[s] || 0
              const isActive = statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(isActive ? "ALL" : s)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    isActive
                      ? s === "ALL"
                        ? "bg-navy text-white ring-1 ring-inset ring-navy"
                        : `${meta.bg} ${meta.color} ring-1 ring-inset ring-silver/30`
                      : "bg-white text-darksilver hover:bg-silver/20 hover:text-black/80"
                  )}
                >
                  {s !== "ALL" && <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />}
                  {s === "ALL" ? "All" : meta?.label ?? s}
                  <span className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    isActive ? (s === "ALL" ? "bg-white/20" : "bg-white/60") : "bg-white"
                  )}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {attendanceQuery.isError && (
        <div className="px-6 pt-4">
          <Alert variant="danger">Unable to load attendance history.</Alert>
        </div>
      )}

      <div className="px-6 pt-3 pb-2">
        {attendanceQuery.isLoading ? (
          <LoadingSkeleton rows={3} columns={4} />
        ) : rows.length === 0 ? (
          <div className="py-4">
            <EmptyState title="No attendance records" description="Scan a QR code to start building history." />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-4">
            <EmptyState
              title="No records for this status"
              description="Try selecting a different attendance status filter."
            />
          </div>
        ) : (
          <ResponsiveTableCards
            data={filteredRows}
            columns={columns}
            rowKey={(record) => record.id}
            renderTitle={(record) => new Date(record.date).toLocaleDateString()}
          />
        )}
      </div>
    </SectionCard>
  )
}
