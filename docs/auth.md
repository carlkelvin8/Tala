# Authentication & Roles

---

## Authentication

The system uses **JWT (JSON Web Token)** based authentication with two tokens:

| Token | Lifetime | Purpose |
|---|---|---|
| Access Token | Short-lived | Sent with every API request |
| Refresh Token | Long-lived | Used to get a new access token |

Both tokens are stored in `localStorage` under the keys:
- `nstp_access_token`
- `nstp_refresh_token`
- `nstp_user` (serialized user object)

---

## Login Flow

1. User submits email (or student number) and password
2. Server looks up user by email; if not found, searches by student number in `StudentProfile`
3. Server verifies password against bcrypt hash
4. Server checks `isActive` flag
5. Server signs and returns `accessToken` and `refreshToken`
6. Frontend stores tokens and user object in localStorage
7. `ProtectedRoute` component reads stored user to guard routes

---

## Token Usage

Every API request to a protected endpoint must include:

```
Authorization: Bearer <accessToken>
```

The `authMiddleware` on the backend:
1. Reads the `Authorization` header
2. Verifies the JWT signature using `JWT_SECRET`
3. Decodes the payload `{ sub: userId, role }`
4. Attaches the user to the Hono context for downstream handlers

---

## Token Refresh

When the access token expires, the frontend should call:

```
POST /api/auth/refresh
{ "refreshToken": "eyJ..." }
```

This returns a new `accessToken` and `refreshToken`.

---

## Roles & Permissions

### ADMIN

Full system access.

| Feature | Access |
|---|---|
| Dashboard | ✅ Full |
| Users | ✅ Create, Read, Update, Delete |
| Enrollment | ✅ Approve, Reject, Assign |
| Students | ✅ Full |
| Sections & Flights | ✅ Full |
| Materials | ✅ Full |
| Attendance | ✅ Full |
| Grades | ✅ Full |
| Merits | ✅ Full |
| Exams | ✅ Full |
| Reports | ✅ Full |
| Profile | ✅ Own profile |

---

### IMPLEMENTOR

Manages academic and program operations.

| Feature | Access |
|---|---|
| Dashboard | ✅ |
| Users | ❌ |
| Enrollment | ✅ Approve, Reject, Assign |
| Students | ✅ Read |
| Sections & Flights | ✅ Read |
| Materials | ✅ Create, Edit, Delete own |
| Attendance | ✅ Host sessions, view records |
| Grades | ✅ Encode, Edit, Delete |
| Merits | ✅ Assign |
| Exams | ✅ Create, Manage |
| Reports | ✅ |
| Profile | ✅ Own profile |

---

### CADET_OFFICER

Manages day-to-day operations for their section.

| Feature | Access |
|---|---|
| Dashboard | ✅ |
| Users | ❌ |
| Enrollment | ✅ View |
| Students | ✅ Read |
| Sections & Flights | ✅ Read |
| Materials | ✅ Create, Edit, Delete own |
| Attendance | ✅ Host sessions, view records |
| Grades | ✅ Encode, Edit, Delete |
| Merits | ✅ Assign |
| Exams | ✅ View |
| Reports | ✅ |
| Profile | ✅ Own profile |

---

### STUDENT

Read-only access to own records.

| Feature | Access |
|---|---|
| Dashboard | ✅ Own stats |
| Users | ❌ |
| Enrollment | ✅ View own |
| Students | ❌ |
| Sections & Flights | ❌ |
| Materials | ✅ View (assigned section/flight) |
| Attendance | ✅ Check in/out, view own history |
| Grades | ✅ View own (no Actions column) |
| Merits | ✅ View own |
| Exams | ✅ Take assigned exams |
| Reports | ❌ |
| Profile | ✅ Own profile |

---

## Frontend Route Guards

The `ProtectedRoute` component wraps all authenticated routes:

```tsx
// Basic auth guard
<ProtectedRoute>
  <SomePage />
</ProtectedRoute>

// Role-based guard
<ProtectedRoute roles={["ADMIN"]}>
  <UsersPage />
</ProtectedRoute>

<ProtectedRoute roles={["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"]}>
  <ReportsPage />
</ProtectedRoute>
```

If the user is not authenticated, they are redirected to `/login`.
If the user lacks the required role, they are redirected to `/dashboard`.

---

## Backend Role Guard

The `roleGuard` middleware is applied per-route:

```typescript
// Only ADMIN can access
router.delete("/:id", authMiddleware, roleGuard(["ADMIN"]), deleteUser)

// Multiple roles allowed
router.get("/", authMiddleware, roleGuard(["ADMIN", "IMPLEMENTOR"]), listUsers)
```

---

## Password Requirements

- Minimum 8 characters
- Validated with Zod on both frontend and backend
- Stored as bcrypt hash (never plain text)

---

## Session Persistence

The user session persists across browser refreshes because tokens are stored in `localStorage`. The session is cleared when:

- User clicks "Sign Out"
- `clearAuthSession()` is called
- The user manually clears localStorage

There is no automatic token expiry handling on the frontend currently — expired access tokens will result in 401 errors.
