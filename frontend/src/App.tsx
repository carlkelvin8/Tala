import { Routes, Route, Navigate } from "react-router-dom"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
import { ModernLoginPage } from "./components/auth/ModernLoginPage"
import { ModernRegisterPage } from "./components/auth/ModernRegisterPage"
import DashboardPage from "./pages/DashboardPage"
import { EnrollmentPage } from "./pages/EnrollmentPage"
import { StudentsPage } from "./pages/StudentsPage"
import { MaterialsPage } from "./pages/MaterialsPage"
import { AttendancePage } from "./pages/AttendancePage"
import { GradesPage } from "./pages/GradesPage"
import { MeritsPage } from "./pages/MeritsPage"
import { ExamsPage } from "./pages/ExamsPage"
import { ReportsPage } from "./pages/ReportsPage"
import { UsersPage } from "./pages/UsersPage"
import { ProfilePage } from "./pages/ProfilePage"
import { FlightsPage } from "./pages/FlightsPage"
import { SectionsPage } from "./pages/SectionsPage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { AppLayout } from "./components/layout/AppLayout"
import { ProtectedRoute } from "./components/ProtectedRoute"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<ModernLoginPage />} />
      <Route path="/register" element={<ModernRegisterPage />} />
      
      {/* Dashboard route - uses its own layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      
      {/* Other routes - use AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/enrollment" element={<EnrollmentPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/sections" element={<SectionsPage />} />
        <Route path="/flights" element={<FlightsPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/grades" element={<GradesPage />} />
        <Route path="/merits" element={<MeritsPage />} />
        <Route path="/exams" element={<ExamsPage />} />
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
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
