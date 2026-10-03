import { useMutation } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { useState, useEffect, useRef } from "react"
import { ScanLine, CheckCircle2, XCircle, Camera, Sparkles } from "lucide-react"
import { getFullName } from "../lib/display"
import { toast } from "sonner"
import { cn } from "../lib/utils"

type ScanResponse = {
  student?: {
    email?: string
    studentProfile?: { firstName: string; lastName: string } | null
    implementorProfile?: { firstName: string; lastName: string } | null
    cadetOfficerProfile?: { firstName: string; lastName: string } | null
  } | null
}

export function ScannerPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<{ stop: () => void; destroy: () => void } | null>(null)
  const processingRef = useRef(false)
  const lastTokenRef = useRef<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const scanMutation = useMutation({
    mutationFn: (token: string) => {
      if (!navigator.onLine) throw new Error("You are offline. Reconnect, then retry the scan.")
      lastTokenRef.current = token
      return apiRequest<ApiResponse<ScanResponse>>("/api/attendance/scan", {
        method: "POST",
        body: JSON.stringify({ token }),
      })
    },
    onSuccess: (data) => {
      const name = data.data?.student ? getFullName(data.data.student) : "Student"
      setScanResult({ success: true, message: `${name} — marked PRESENT` })
      toast.success("Attendance recorded")
      lastTokenRef.current = null
      processingRef.current = false
      setTimeout(() => setScanResult(null), 4000)
    },
    onError: (error) => {
      setScanResult({ success: false, message: error instanceof Error ? error.message : "Scan failed" })
      toast.error("Scan failed")
      processingRef.current = false
      setTimeout(() => setScanResult(null), 4000)
    },
  })

  const stopScanning = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop()
        scannerRef.current.destroy()
      } catch { /* scanner may already be shutting down */ }
      scannerRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const startScanning = () => {
    if (!navigator.onLine) {
      setScanResult({ success: false, message: "You are offline. Connect to the internet before scanning." })
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanResult({ success: false, message: "Camera access requires HTTPS and a supported browser." })
      return
    }
    setIsScanning(true)
    setScanResult(null)
  }

  const submitToken = (token: string) => {
    if (processingRef.current || scanMutation.isPending) return
    processingRef.current = true
    scanMutation.mutate(token)
    stopScanning()
  }

  useEffect(() => {
    if (!isScanning || !videoRef.current) return

    let stopped = false

    async function init() {
      try {
        const QrScanner = (await import("qr-scanner")).default
        if (stopped || !videoRef.current) return
        const scanner = new QrScanner(
          videoRef.current,
          (result: { data: string }) => {
            if (result?.data) submitToken(result.data.trim())
          },
          { returnDetailedScanResult: true, preferredCamera: "environment" }
        )
        scannerRef.current = scanner
        await scanner.start()
      } catch (error) {
        if (stopped) return
        const message = error instanceof DOMException && error.name === "NotAllowedError"
          ? "Camera access was denied. Enable camera permission in your browser settings, then try again."
          : "Camera could not start. Check browser permissions and make sure no other app is using it."
        setScanResult({ success: false, message })
        stopScanning()
      }
    }

    init()

    return () => {
      stopped = true
      if (scannerRef.current) {
        try { scannerRef.current.stop(); scannerRef.current.destroy() } catch {}
        scannerRef.current = null
      }
    }
  }, [isScanning])

  useEffect(() => {
    return () => stopScanning()
  }, [])

  useEffect(() => {
    const updateNetworkState = () => setIsOnline(navigator.onLine)
    window.addEventListener("online", updateNetworkState)
    window.addEventListener("offline", updateNetworkState)
    return () => {
      window.removeEventListener("online", updateNetworkState)
      window.removeEventListener("offline", updateNetworkState)
    }
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-10 py-8 shadow-elevated">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-royal/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <ScanLine className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-gold text-xs font-medium uppercase tracking-wider mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Attendance Scanner</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Attendance Scanner</h1>
            <p className="mt-1 text-sm text-silver max-w-2xl">Scan student QR codes to record attendance quickly and reliably.</p>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              aria-pressed={isScanning}
              aria-label={isScanning ? "Stop attendance scanner" : "Open attendance scanner"}
              onClick={isScanning ? stopScanning : startScanning}
              disabled={scanMutation.isPending || !isOnline}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 shadow-soft",
                isScanning
                  ? "bg-white/10 text-white hover:bg-white/20 ring-1 ring-white/20"
                  : "bg-white text-black hover:bg-white hover:shadow-card-hover"
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
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-silver/30 bg-white p-6 sm:p-8 shadow-card">
        <div className="flex flex-col items-center gap-6">
          {isScanning ? (
            <div className="relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-silver/30 bg-black shadow-elevated">
              <video
                ref={videoRef}
                className="w-full"
                playsInline
                muted
                aria-label="Live camera preview for QR scanning"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-52 w-52">
                  <div className="absolute inset-0 rounded-2xl border-2 border-white/40" />
                  <div className="absolute left-0 top-0 h-10 w-10 border-l-[3px] border-t-[3px] border-white rounded-tl-2xl" />
                  <div className="absolute right-0 top-0 h-10 w-10 border-r-[3px] border-t-[3px] border-white rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 h-10 w-10 border-l-[3px] border-b-[3px] border-white rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 h-10 w-10 border-r-[3px] border-b-[3px] border-white rounded-br-2xl" />
                </div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-4 py-1.5 text-xs text-white/90 backdrop-blur-sm">
                  <ScanLine className="h-3 w-3" />
                  Point camera at QR code
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-[340px] w-full max-w-[480px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-silver/30 bg-white/50 transition-all duration-200 hover:border-silver/40 hover:bg-white">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-silver/20 mb-4">
                <Camera className="h-8 w-8 text-silver" strokeWidth={1.25} />
              </span>
              <p className="text-sm font-medium text-darksilver">Camera is idle</p>
              <p className="text-xs text-darksilver mt-1">Click "Open Scanner" to start scanning student QR codes.</p>
            </div>
          )}
          {!isOnline && (
            <div role="status" className="w-full max-w-[480px] rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-900">
              Offline — reconnect to record attendance.
            </div>
          )}
          {scanResult && (
            <div className={cn(
              "flex items-center gap-3 rounded-xl border px-5 py-3.5 text-sm shadow-soft animate-scale-in w-full max-w-[480px]",
              scanResult.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            )} role="status" aria-live="polite">
              {scanResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{scanResult.message}</span>
              {!scanResult.success && lastTokenRef.current && isOnline && (
                <Button type="button" size="sm" variant="outline" className="ml-auto" onClick={() => submitToken(lastTokenRef.current!)} disabled={scanMutation.isPending}>
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
