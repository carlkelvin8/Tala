import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom" // Import routing primitives: Routes (route container), Route (individual route), Navigate (redirect component)
import { AppLayout } from "./components/layout/AppLayout" // Import the shared app layout wrapper (sidebar + topbar) for most pages
import { ProtectedRoute } from "./components/ProtectedRoute" // Import the route guard component that checks authentication and role

const ModernLoginPage = lazy(() => import("./components/auth/ModernLoginPage").then((module) => ({ default: module.ModernLoginPage })))
const ModernRegisterPage = lazy(() => import("./components/auth/ModernRegisterPage").then((module) => ({ default: module.ModernRegisterPage })))
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

function PageFallback() {
  return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-medium text-slate-500">Loading…</div>
}

// Root application component that defines the entire client-side routing tree
export function App() {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes> {/* Routes container — renders only the first matching Route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} /> {/* Redirect the root path "/" to "/dashboard" without adding to browser history */}
      <Route path="/login" element={<ModernLoginPage />} /> {/* Public route: render the modern login page at /login */}
      <Route path="/register" element={<ModernRegisterPage />} /> {/* Public route: render the modern register page at /register */}
      
      {/* Dashboard route - uses its own layout */}
      <Route
        path="/dashboard" // Match the /dashboard URL path
        element={
          <ProtectedRoute> {/* Guard: redirect to /login if user is not authenticated */}
            <DashboardPage /> {/* Render the dashboard page which includes its own PremiumAppSidebar layout */}
          </ProtectedRoute>
        }
      />
      
      {/* Other routes - use AppLayout */}
      <Route
        element={ // This Route has no path — it acts as a layout wrapper for all nested routes
          <ProtectedRoute> {/* Guard: redirect to /login if user is not authenticated */}
            <AppLayout /> {/* Render the shared layout (sidebar + topbar + <Outlet />) for all nested routes */}
          </ProtectedRoute>
        }
      >
        <Route path="/enrollment" element={<EnrollmentPage />} /> {/* Enrollment management page inside AppLayout */}
        <Route path="/students" element={<StudentsPage />} /> {/* Student directory page inside AppLayout */}
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/sections" element={<SectionsPage />} /> {/* Sections management page inside AppLayout */}
        <Route path="/flights" element={<FlightsPage />} /> {/* Flights management page inside AppLayout */}
        <Route path="/materials" element={<MaterialsPage />} /> {/* Learning materials page inside AppLayout */}
        <Route path="/attendance" element={<AttendancePage />} /> {/* Attendance tracking page inside AppLayout */}
        <Route
          path="/scanner"
          element={
            <ProtectedRoute roles={["ADMIN", "IMPLEMENTOR"]}>
              <ScannerPage />
            </ProtectedRoute>
          }
        />
        <Route path="/training" element={<TrainingPage />} /> {/* Training monitoring page inside AppLayout */}
        <Route
          path="/terms"
          element={
            <ProtectedRoute roles={["ADMIN", "IMPLEMENTOR"]}>
              <TermsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/grades" element={<GradesPage />} /> {/* Grades management page inside AppLayout */}
        <Route path="/merits" element={<MeritsPage />} /> {/* Merits and demerits page inside AppLayout */}
        <Route path="/exams" element={<ExamsPage />} /> {/* Exam sessions page inside AppLayout */}
        <Route
          path="/reports" // Reports page with additional role restriction
          element={
            <ProtectedRoute roles={["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"]}> {/* Guard: redirect to /dashboard if user is a STUDENT */}
              <ReportsPage /> {/* Render the reports page only for non-student roles */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/users" // User management page with strict admin-only restriction
          element={
            <ProtectedRoute roles={["ADMIN"]}> {/* Guard: redirect to /dashboard if user is not an ADMIN */}
              <UsersPage /> {/* Render the user management page only for admins */}
            </ProtectedRoute>
          }
        />
        <Route path="/audit-logs" element={<ProtectedRoute roles={["ADMIN"]}><AuditLogsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProfilePage />} /> {/* Profile settings page inside AppLayout, accessible to all authenticated users */}
      </Route>
      <Route path="*" element={<NotFoundPage />} /> {/* Catch-all route: render the 404 page for any unmatched URL */}
    </Routes>
    </Suspense>
  )
}
