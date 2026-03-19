# API Reference

Base URL: `http://localhost:4000` (development) or your deployed backend URL.

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

All responses follow the envelope format:
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "Error description" }
```

---

## Authentication — `/api/auth`

### POST `/api/auth/register`

Register a new user account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "role": "STUDENT",
  "firstName": "Juan",
  "lastName": "Dela Cruz",
  "studentNo": "2024-00001"
}
```

| Field | Required | Notes |
|---|---|---|
| `email` | Yes | Must be unique |
| `password` | Yes | Minimum 8 characters |
| `role` | Yes | ADMIN, IMPLEMENTOR, CADET_OFFICER, STUDENT |
| `firstName` | Yes | |
| `lastName` | Yes | |
| `studentNo` | No | Required for STUDENT role, must be unique |

**Response `201`:**
```json
{
  "success": true,
  "message": "User registered",
  "data": { "id": "uuid", "email": "...", "role": "STUDENT" }
}
```

---

### POST `/api/auth/login`

Login with email or student number.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

> The `email` field accepts both email addresses and student numbers (e.g., `2024-00001`).

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "STUDENT",
      "avatarUrl": null,
      "avatarFrame": "gradient"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### POST `/api/auth/refresh`

Refresh an expired access token.

**Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response `200`:**
```json
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### GET `/api/auth/profile` 🔒

Get the authenticated user's full profile.

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "STUDENT",
    "isActive": true,
    "avatarUrl": null,
    "avatarFrame": "gradient",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "profile": {
      "firstName": "Juan",
      "lastName": "Dela Cruz",
      "studentNo": "2024-00001",
      "middleName": null,
      "birthDate": null,
      "gender": null,
      "contactNo": null,
      "address": null
    }
  }
}
```

---

### PATCH `/api/auth/profile` 🔒

Update the authenticated user's profile.

**Body:**
```json
{
  "firstName": "Juan",
  "lastName": "Dela Cruz",
  "middleName": "Santos",
  "contactNo": "09123456789",
  "address": "Manila, Philippines",
  "birthDate": "2000-01-15",
  "gender": "MALE"
}
```

---

### PATCH `/api/auth/avatar` 🔒

Upload a profile photo as a base64 data URI.

**Body:**
```json
{ "avatarUrl": "data:image/jpeg;base64,/9j/4AAQ..." }
```

> Maximum size: ~300KB (base64 encoded). The image is stored directly in the database.

---

### DELETE `/api/auth/avatar` 🔒

Remove the profile photo.

---

### PATCH `/api/auth/avatar-frame` 🔒

Update the avatar frame style.

**Body:**
```json
{ "avatarFrame": "glow" }
```

Valid values: `none`, `gradient`, `double`, `glow`, `hexagon`, `badge`

---

### POST `/api/auth/change-password` 🔒

Change the authenticated user's password.

**Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

---

### POST `/api/auth/logout` 🔒

Logout (client should discard tokens).

---

## Users — `/api/users` 🔒

> Requires ADMIN role.

### GET `/api/users`

List all users with optional filters.

**Query params:**
- `role` — Filter by role
- `search` — Search by name or email
- `page`, `limit` — Pagination

---

### POST `/api/users`

Create a new user.

**Body:** Same as `/api/auth/register`

---

### PATCH `/api/users/:id`

Update a user's details or status.

---

### DELETE `/api/users/:id`

Soft-delete a user.

---

## Enrollments — `/api/enrollments` 🔒

### GET `/api/enrollments`

List enrollments.

**Query params:**
- `status` — PENDING, APPROVED, REJECTED
- `sectionId`, `flightId`
- `page`, `limit`

---

### POST `/api/enrollments`

Create an enrollment request.

**Body:**
```json
{ "userId": "uuid" }
```

---

### PATCH `/api/enrollments/:id/status`

Approve or reject an enrollment.

**Body:**
```json
{
  "status": "APPROVED",
  "sectionId": "uuid",
  "flightId": "uuid"
}
```

---

## Attendance Sessions — `/api/attendance-sessions` 🔒

### POST `/api/attendance-sessions`

Create a new attendance session.

**Body:**
```json
{
  "title": "Morning Formation",
  "date": "2024-03-15",
  "startTime": "2024-03-15T07:00:00.000Z",
  "radiusMeters": 50,
  "requireVerifier": false,
  "sectionId": "uuid"
}
```

---

### PATCH `/api/attendance-sessions/:id/host-location`

Update the host's GPS coordinates.

**Body:**
```json
{ "latitude": 14.5995, "longitude": 120.9842 }
```

---

### PATCH `/api/attendance-sessions/:id/verifier`

Assign a verifier to the session.

**Body:**
```json
{ "verifierId": "uuid" }
```

---

### POST `/api/attendance-sessions/:id/mark-attendance`

Mark a student's attendance in a session.

**Body:**
```json
{
  "studentId": "uuid",
  "latitude": 14.5995,
  "longitude": 120.9842
}
```

> The server validates that the student's coordinates are within `radiusMeters` of the host using the Haversine formula.

---

## Attendance — `/api/attendance` 🔒

### POST `/api/attendance/check-in`

Student checks in.

**Body:**
```json
{
  "sessionId": "uuid",
  "latitude": 14.5995,
  "longitude": 120.9842
}
```

---

### POST `/api/attendance/check-out`

Student checks out.

**Body:**
```json
{
  "sessionId": "uuid",
  "latitude": 14.5995,
  "longitude": 120.9842
}
```

---

### GET `/api/attendance`

List attendance records.

**Query params:**
- `userId` — Filter by student
- `sessionId` — Filter by session
- `date` — Filter by date
- `status` — PRESENT, LATE, ABSENT

---

## Grades — `/api/grades` 🔒

### GET `/api/grades/categories`

List all grade categories.

---

### POST `/api/grades/categories`

Create a grade category.

**Body:**
```json
{ "name": "Quizzes", "weight": 30 }
```

---

### PATCH `/api/grades/categories/:id`

Update a category.

---

### DELETE `/api/grades/categories/:id`

Delete a category.

---

### GET `/api/grades/items`

List all grade items.

---

### POST `/api/grades/items`

Create a grade item.

**Body:**
```json
{
  "title": "Quiz 1",
  "maxScore": 50,
  "categoryId": "uuid"
}
```

---

### GET `/api/grades`

List student grades.

**Query params:**
- `studentId` — Filter by student
- `gradeItemId` — Filter by item

---

### POST `/api/grades`

Encode a student grade.

**Body:**
```json
{
  "studentId": "uuid",
  "gradeItemId": "uuid",
  "score": 45
}
```

---

### PATCH `/api/grades/:id`

Update a grade.

---

### DELETE `/api/grades/:id`

Delete a grade.

---

## Merits — `/api/merits` 🔒

### GET `/api/merits`

List merit/demerit records.

**Query params:**
- `studentId`
- `type` — MERIT or DEMERIT

---

### POST `/api/merits`

Assign a merit or demerit.

**Body:**
```json
{
  "studentId": "uuid",
  "type": "MERIT",
  "points": 5,
  "reason": "Outstanding performance during formation"
}
```

---

## Exams — `/api/exams` 🔒

### GET `/api/exams`

List exam sessions.

---

### POST `/api/exams`

Create an exam session.

**Body:**
```json
{
  "title": "Midterm Exam",
  "description": "Covers modules 1-5",
  "durationMin": 60,
  "scheduledAt": "2024-03-20T09:00:00.000Z",
  "sectionId": "uuid"
}
```

---

### POST `/api/exams/attempts`

Start an exam attempt (student).

**Body:**
```json
{ "examSessionId": "uuid" }
```

---

### PATCH `/api/exams/attempts/:id`

End an exam attempt.

---

### POST `/api/exams/attempts/:id/log`

Log a monitoring event during an attempt.

**Body:**
```json
{ "event": "TAB_SWITCH" }
```

---

## Materials — `/api/materials` 🔒

### GET `/api/materials`

List learning materials.

**Query params:**
- `category` — MODULE, LECTURE, ANNOUNCEMENT, ACTIVITY
- `sectionId`, `flightId`

---

### POST `/api/materials/upload`

Upload a file attachment.

**Body:** `multipart/form-data` with `file` field.

---

### POST `/api/materials`

Create a learning material.

**Body:**
```json
{
  "title": "Module 1: Introduction to NSTP",
  "description": "Overview of the NSTP program",
  "category": "MODULE",
  "fileUrl": "/uploads/filename.pdf",
  "sectionId": "uuid"
}
```

---

### PATCH `/api/materials/:id`

Update a material.

---

### DELETE `/api/materials/:id`

Delete a material.

---

## Sections — `/api/sections` 🔒

### GET `/api/sections`

List all sections.

---

### POST `/api/sections`

Create a section.

**Body:**
```json
{ "code": "SEC-A", "name": "Section Alpha" }
```

---

### PATCH `/api/sections/:id`

Update a section.

---

### DELETE `/api/sections/:id`

Delete a section.

---

## Flights — `/api/flights` 🔒

### GET `/api/flights`

List all flights.

---

### POST `/api/flights`

Create a flight.

**Body:**
```json
{ "code": "FLT-1", "name": "Flight One" }
```

---

### PATCH `/api/flights/:id`

Update a flight.

---

### DELETE `/api/flights/:id`

Delete a flight.

---

## Dashboard — `/api/dashboard` 🔒

### GET `/api/dashboard/summary`

Get dashboard statistics.

**Response includes:**
- Total students, active enrollments
- Attendance summary
- Recent activity

---

## Reports — `/api/reports` 🔒

> Requires ADMIN, IMPLEMENTOR, or CADET_OFFICER role.

Various reporting endpoints for attendance, grades, merits, and enrollment statistics.

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Bad request / validation error |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (insufficient role) |
| `404` | Not found |
| `500` | Internal server error |
