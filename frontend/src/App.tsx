import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { ProtectedRoute } from "./components/ProtectedRoute"

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

function PageFallback() {
  return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-medium text-slate-500">Loading…</div>
}

export function App() {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/enrollment" element={<EnrollmentPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/sections" element={<SectionsPage />} />
        <Route path="/flights" element={<FlightsPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route
          path="/scanner"
          element={
            <ProtectedRoute roles={["IMPLEMENTOR"]}>
              <ScannerPage />
            </ProtectedRoute>
          }
        />
        <Route path="/training" element={<TrainingPage />} />
        <Route
          path="/terms"
          element={
            <ProtectedRoute roles={["ADMIN", "IMPLEMENTOR"]}>
              <TermsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/grades" element={<GradesPage />} />
        <Route path="/merits" element={<MeritsPage />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route
          path="/medical-certificates"
          element={
            <ProtectedRoute roles={["IMPLEMENTOR", "STUDENT"]}>
              <MedicalCertificatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/audit-logs" element={<ProtectedRoute roles={["ADMIN"]}><AuditLogsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  )
}
