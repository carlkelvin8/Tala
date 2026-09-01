import { lazy, Suspense, useState } from "react"
import { Navigate } from "react-router-dom"
import { getStoredUser, getUserDisplayName } from "../lib/auth"
import { PremiumAppSidebar } from "../components/layout/PremiumAppSidebar"
import { DataTable } from "../components/data-table"
import { SectionCards } from "../components/section-cards"
import { StudentDashboard } from "../components/student-dashboard"
import { MandatoryCourses } from "../components/mandatory-courses"
import { ImplementorShortcuts } from "../components/implementor-shortcuts"
import { SiteHeader } from "../components/site-header"
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar"
import { Drawer } from "../components/ui/drawer"
import { Badge } from "../components/ui/badge"
import { type ProgramType } from "../types"
import { programFullLabels, programLabels, getEffectiveProgram } from "../lib/programs"
import { Sparkles } from "lucide-react"
import { motion } from "framer-motion"

const ChartAreaInteractive = lazy(() =>
  import("../components/chart-area-interactive").then((module) => ({ default: module.ChartAreaInteractive }))
)

export default function DashboardPage({ program: programProp }: { program?: ProgramType }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = getStoredUser()
  const isImplementor = user?.role === "IMPLEMENTOR"
  const isStudent = user?.role === "STUDENT"
  const displayName = user ? getUserDisplayName(user) : null

  // Admins use program-scoped dashboards (/dashboard/cwts, /dashboard/rotc)
  if (user?.role === "ADMIN" && !programProp) {
    return <Navigate to="/dashboard/cwts" replace />
  }
  // Implementors are locked to ROTC and land on the ROTC dashboard
  if (isImplementor && !programProp) {
    return <Navigate to="/dashboard/rotc" replace />
  }

  const program = programProp ?? (getEffectiveProgram(user) as ProgramType | null)
  const programLabel = program ? programFullLabels[program] : null

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 14)",
        } as React.CSSProperties
      }
    >
      <PremiumAppSidebar variant="inset" className="hidden lg:block" />
      <SidebarInset className="bg-white/50">
        <SiteHeader onMenuClick={() => setSidebarOpen(true)} />
        <motion.div
          className="flex flex-1 flex-col gap-6 p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Hero banner */}
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-8 py-6 sm:py-7 shadow-card"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <motion.div
              className="absolute inset-0 bg-grid opacity-[0.08]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.08 }}
              transition={{ duration: 1 }}
            />
            <motion.div
              className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.18, 0.1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-royal/10 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
            <div className="relative">
              <motion.div
                className="flex items-center gap-2 text-gold text-xs font-medium uppercase tracking-wider mb-2"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
              >
                <motion.span
                  animate={{ rotate: [0, 20, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </motion.span>
                <span>National Service Training Program Management System</span>
              </motion.div>
              <motion.h1
                className="text-2xl font-bold text-white tracking-tight"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
              >
                {displayName ? `Welcome back, ${displayName}` : "Dashboard"}
              </motion.h1>
              {program && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-white/10 text-gold border-white/20"
                  >
                    <Sparkles className="h-3 w-3" />
                    {programLabels[program]}
                  </Badge>
                  <span className="text-xs text-silver">{programLabel}</span>
                </div>
              )}
              <motion.p
                className="mt-1.5 text-sm text-silver max-w-xl"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
              >
                Real-time summary of your NSTP program{program ? ` (${programLabel})` : ""}. Monitor attendance, grades, merits, and enrollment at a glance.
              </motion.p>
            </div>
          </motion.div>

          {!isStudent && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <SectionCards program={program ?? undefined} />
            </motion.div>
          )}

          {isStudent ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <StudentDashboard />
            </motion.div>
          ) : (
            <>
              {isImplementor && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] as const }}
                >
                  <ImplementorShortcuts />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
              >
                <MandatoryCourses program={program ?? undefined} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
              >
                <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading attendance chart" />}>
                  <ChartAreaInteractive program={program ?? undefined} />
                </Suspense>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
              >
                <DataTable program={program ?? undefined} />
              </motion.div>
            </>
          )}
        </motion.div>
      </SidebarInset>
      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen} title="Navigation">
        <PremiumAppSidebar onNavigate={() => setSidebarOpen(false)} className="border-none" />
      </Drawer>
    </SidebarProvider>
  )
}
