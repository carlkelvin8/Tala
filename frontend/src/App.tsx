import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { getStoredUser } from "./lib/auth"

const ModernLoginPage = lazy(() => import("./components/auth/ModernLoginPage").then((module) => ({ default: module.ModernLoginPage })))
const ModernRegisterPage = lazy(() => import("./components/auth/ModernRegisterPage").then((module) => ({ default: module.ModernRegisterPage })))
const ForgotPasswordPage = lazy(() => import("./components/auth/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage })))
const DashboardPage = lazy(() => import("./pages/DashboardPage"))
const EnrollmentPage = lazy(() => import("./pages/EnrollmentPage").then((module) => ({ default: module.EnrollmentPage })))
const StudentsPage = lazy(() => import("./pages/StudentsPage").then((module) => ({ default: module.StudentsPage })))
const MaterialsPage = lazy(() => import("./pages/MaterialsPage").then((module) => ({ default: module.MaterialsPage })))
const AttendancePage = lazy(() => import("./pages/AttendancePage").then((module) => ({ default: module.AttendancePage })))
const GradesPage = lazy(() => import("./pages/GradesPage").then((module) => ({ default: module.GradesPage })))
const MeritsPage = lazy(() => import("./pages/MeritsPage").then((module) => ({ default: module.MeritsPage })))
const ExamsPage = lazy(() => import("./pages/ExamsPage").then((module) => ({ default: module.ExamsPage })))
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((module) => ({ default: module.ReportsPage })))
const UsersPage = lazy(() => import("./pages/UsersPage").then((module) => ({ default: module.UsersPage })))
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((module) => ({ default: module.ProfilePage })))
const FlightsPage = lazy(() => import("./pages/FlightsPage").then((module) => ({ default: module.FlightsPage })))
const SectionsPage = lazy(() => import("./pages/SectionsPage").then((module) => ({ default: module.SectionsPage })))
const CoursesPage = lazy(() => import("./pages/CoursesPage").then((module) => ({ default: module.CoursesPage })))
const ScannerPage = lazy(() => import("./pages/ScannerPage").then((module) => ({ default: module.ScannerPage })))
const TrainingPage = lazy(() => import("./pages/TrainingPage").then((module) => ({ default: module.TrainingPage })))
const TermsPage = lazy(() => import("./pages/TermsPage").then((module) => ({ default: module.TermsPage })))
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })))
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage").then((module) => ({ default: module.AuditLogsPage })))
const MedicalCertificatesPage = lazy(() => import("./pages/MedicalCertificatesPage").then((module) => ({ default: module.MedicalCertificatesPage })))
const SubmissionsPage = lazy(() => import("./pages/SubmissionsPage").then((module) => ({ default: module.SubmissionsPage })))
const CertificatesPage = lazy(() => import("./pages/CertificatesPage").then((module) => ({ default: module.CertificatesPage })))
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage").then((module) => ({ default: module.LeaderboardPage })))
const CalendarPage = lazy(() => import("./pages/CalendarPage").then((module) => ({ default: module.CalendarPage })))
const LiveMonitorPage = lazy(() => import("./pages/LiveMonitorPage").then((module) => ({ default: module.LiveMonitorPage })))

function PageFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-silver border-t-navy" />
        <p className="text-sm font-medium text-slate-500">Loading…</p>
      </div>
    </div>
  )
}

export function App() {
  const user = getStoredUser()

  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<ModernLoginPage />} />
      <Route path="/register" element={<ModernRegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/cwts"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <DashboardPage program="CWTS" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/rotc"
        element={
          <ProtectedRoute roles={["ADMIN", "IMPLEMENTOR"]}>
            <DashboardPage program="ROTC" />
          </ProtectedRoute>
        }
      />
      
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/enrollment" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR"]}><EnrollmentPage /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR"]}><StudentsPage /></ProtectedRoute>} />
        <Route path="/courses/cwts" element={<ProtectedRoute roles={["ADMIN"]}><CoursesPage program="CWTS" /></ProtectedRoute>} />
        <Route path="/courses/rotc" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR"]}><CoursesPage program="ROTC" /></ProtectedRoute>} />
        <Route path="/courses" element={<Navigate to="/courses/rotc" replace />} />
        <Route path="/sections" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR"]}><SectionsPage /></ProtectedRoute>} />
        <Route path="/flights" element={<ProtectedRoute roles={["ADMIN", "CADET_OFFICER"]}><FlightsPage /></ProtectedRoute>} />
        <Route path="/materials" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"]}><MaterialsPage /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR", "STUDENT"]}><AttendancePage /></ProtectedRoute>} />
        <Route path="/scanner" element={<ProtectedRoute roles={["IMPLEMENTOR"]}><ScannerPage /></ProtectedRoute>} />
        <Route path="/training" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR"]}><TrainingPage /></ProtectedRoute>} />
        <Route path="/terms" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR"]}><TermsPage /></ProtectedRoute>} />
        <Route path="/grades" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR", "STUDENT"]}><GradesPage /></ProtectedRoute>} />
        <Route path="/merits" element={<ProtectedRoute roles={["ADMIN", "STUDENT"]}><MeritsPage /></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR", "STUDENT"]}><ExamsPage /></ProtectedRoute>} />
        <Route path="/medical-certificates" element={<ProtectedRoute roles={["IMPLEMENTOR", "STUDENT"]}><MedicalCertificatesPage /></ProtectedRoute>} />
        <Route path="/submissions" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR", "STUDENT"]}><SubmissionsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"]}><ReportsPage /></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR"]}><CertificatesPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/live-monitor" element={<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"]}><LiveMonitorPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={["ADMIN"]}><UsersPage /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute roles={["ADMIN"]}><AuditLogsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  )
}
