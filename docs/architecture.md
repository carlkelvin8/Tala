# Architecture

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                        │
│                                                             │
│   React + Vite + TailwindCSS + TanStack Query               │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │  Pages   │  │Components│  │  Router  │  │  State   │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / REST (JSON)
                         │ Authorization: Bearer <token>
┌────────────────────────▼────────────────────────────────────┐
│                     Hono API Server                         │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Routes  │→ │Controllers│→ │ Services │→ │  Repos   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                    │        │
│  Middlewares: authMiddleware, roleGuard, zod, CORS │        │
└────────────────────────────────────────────────────┼────────┘
                                                     │ Prisma ORM
┌────────────────────────────────────────────────────▼────────┐
│                  PostgreSQL (Neon Serverless)                │
│                                                             │
│  Users, Profiles, Enrollments, Attendance, Grades,          │
│  Merits, Exams, Materials, Sections, Flights, Audit Logs    │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

The backend follows a layered architecture pattern:

### Layer 1 — Routes

Route files define HTTP method + path and attach middleware and controller functions.

```
/api/auth        → authRoutes.ts
/api/users       → userRoutes.ts
/api/enrollments → enrollmentRoutes.ts
/api/materials   → materialRoutes.ts
/api/attendance  → attendanceRoutes.ts
/api/grades      → gradeRoutes.ts
/api/merits      → meritRoutes.ts
/api/exams       → examRoutes.ts
/api/sections    → sectionRoutes.ts
/api/flights     → flightRoutes.ts
/api/reports     → reportRoutes.ts
/api/dashboard   → dashboardRoutes.ts
```

### Layer 2 — Controllers

Controllers handle the HTTP request/response cycle. They:
- Parse request body and query params
- Call service functions
- Return JSON responses using `ok()` / `fail()` helpers

### Layer 3 — Services

Services contain all business logic. They:
- Validate business rules
- Orchestrate multiple repository calls
- Write audit logs
- Throw descriptive errors

### Layer 4 — Repositories

Repositories are thin wrappers around Prisma queries. They:
- Abstract database access
- Provide reusable query methods
- Keep controllers and services clean

### Middleware Stack

```
Request
  → logger()           (Hono built-in request logging)
  → cors()             (CORS headers for allowed origins)
  → secureHeaders()    (Security headers)
  → authMiddleware()   (JWT verification, sets user context)
  → roleGuard()        (Role-based access control)
  → validateBody()     (Zod schema validation)
  → controller()       (Business logic)
  → errorHandler()     (Catch-all error handler)
Response
```

---

## Frontend Architecture

### Routing

React Router v6 with nested routes:

```
/                    → redirect to /dashboard
/login               → ModernLoginPage (public)
/register            → ModernRegisterPage (public)
/dashboard           → DashboardPage (ProtectedRoute)
/enrollment          → EnrollmentPage (ProtectedRoute + AppLayout)
/students            → StudentsPage
/sections            → SectionsPage
/flights             → FlightsPage
/materials           → MaterialsPage
/attendance          → AttendancePage
/grades              → GradesPage
/merits              → MeritsPage
/exams               → ExamsPage
/reports             → ReportsPage (ADMIN, IMPLEMENTOR, CADET_OFFICER only)
/users               → UsersPage (ADMIN only)
/profile             → ProfilePage
```

### State Management

- **Server state**: TanStack Query (`useQuery`, `useMutation`)
  - Automatic background refetching (5–10 second intervals)
  - Optimistic updates on mutations
  - Cache invalidation on success
- **Auth state**: localStorage (access token, refresh token, user object)
- **UI state**: React `useState` / `useRef` (local component state)

### Data Fetching Pattern

```typescript
// Query
const { data, isLoading, isError } = useQuery({
  queryKey: ["resource", filters],
  queryFn: () => apiRequest<ApiResponse<T>>("/api/resource"),
  refetchInterval: 5000,
})

// Mutation
const mutation = useMutation({
  mutationFn: (values) => apiRequest("/api/resource", {
    method: "POST",
    body: JSON.stringify(values),
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["resource"] })
    toast.success("Done!")
  },
})
```

### API Client

All requests go through `frontend/src/lib/api.ts`:

```typescript
export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  // Automatically attaches Authorization header
  // Parses JSON response
  // Throws Error with server message on non-2xx
}
```

---

## Authentication Flow

```
1. User submits login form
        ↓
2. POST /api/auth/login
        ↓
3. Server validates credentials
   - Finds user by email OR student number
   - Verifies bcrypt password hash
   - Checks isActive flag
        ↓
4. Server returns:
   { user: {...}, accessToken, refreshToken }
        ↓
5. Frontend stores in localStorage:
   - nstp_access_token
   - nstp_refresh_token
   - nstp_user (JSON)
        ↓
6. All subsequent requests include:
   Authorization: Bearer <accessToken>
        ↓
7. authMiddleware verifies JWT on every protected route
   - Decodes token
   - Attaches user to context
        ↓
8. roleGuard checks user.role against allowed roles
```

---

## Response Format

All API responses follow a consistent envelope:

```typescript
// Success
{
  "success": true,
  "message": "Human readable message",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Error description"
}
```

Implemented via `ok()` and `fail()` helpers in `backend/src/lib/response.ts`.
