import { Routes, Route, Navigate } from "react-router-dom" // Import routing primitives: Routes (route container), Route (individual route), Navigate (redirect component)
import { LoginPage } from "./pages/LoginPage" // Import the legacy login page (kept for reference but not used in active routes)
import { RegisterPage } from "./pages/RegisterPage" // Import the legacy register page (kept for reference but not used in active routes)
import { ModernLoginPage } from "./components/auth/ModernLoginPage" // Import the modern redesigned login page component
import { ModernRegisterPage } from "./components/auth/ModernRegisterPage" // Import the modern redesigned register page component
import DashboardPage from "./pages/DashboardPage" // Import the dashboard page (default export) with its own sidebar layout
import { EnrollmentPage } from "./pages/EnrollmentPage" // Import the enrollment management page
import { StudentsPage } from "./pages/StudentsPage" // Import the student directory page
import { MaterialsPage } from "./pages/MaterialsPage" // Import the learning materials page
import { AttendancePage } from "./pages/AttendancePage" // Import the attendance tracking page
import { GradesPage } from "./pages/GradesPage" // Import the grades management page
import { MeritsPage } from "./pages/MeritsPage" // Import the merits and demerits page
import { ExamsPage } from "./pages/ExamsPage" // Import the exam sessions page
import { ReportsPage } from "./pages/ReportsPage" // Import the reports and CSV export page
import { UsersPage } from "./pages/UsersPage" // Import the user management page (admin only)
import { ProfilePage } from "./pages/ProfilePage" // Import the user profile settings page
import { FlightsPage } from "./pages/FlightsPage" // Import the flight groups management page
import { SectionsPage } from "./pages/SectionsPage" // Import the class sections management page
import { NotFoundPage } from "./pages/NotFoundPage" // Import the 404 not found page
import { AppLayout } from "./components/layout/AppLayout" // Import the shared app layout wrapper (sidebar + topbar) for most pages
import { ProtectedRoute } from "./components/ProtectedRoute" // Import the route guard component that checks authentication and role

// Root application component that defines the entire client-side routing tree
export function App() {
  return (
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
        <Route path="/sections" element={<SectionsPage />} /> {/* Sections management page inside AppLayout */}
        <Route path="/flights" element={<FlightsPage />} /> {/* Flights management page inside AppLayout */}
        <Route path="/materials" element={<MaterialsPage />} /> {/* Learning materials page inside AppLayout */}
        <Route path="/attendance" element={<AttendancePage />} /> {/* Attendance tracking page inside AppLayout */}
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
        <Route path="/profile" element={<ProfilePage />} /> {/* Profile settings page inside AppLayout, accessible to all authenticated users */}
      </Route>
      <Route path="*" element={<NotFoundPage />} /> {/* Catch-all route: render the 404 page for any unmatched URL */}
    </Routes>
  )
}
