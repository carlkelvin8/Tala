# Database Schema

The database uses PostgreSQL managed through Prisma ORM. Below is the complete schema reference.

---

## Enums

```prisma
enum RoleType {
  ADMIN
  IMPLEMENTOR
  CADET_OFFICER
  STUDENT
}

enum EnrollmentStatus {
  PENDING
  APPROVED
  REJECTED
}

enum AttendanceStatus {
  PRESENT
  LATE
  ABSENT
}

enum MeritType {
  MERIT
  DEMERIT
}

enum MaterialCategory {
  MODULE
  LECTURE
  ANNOUNCEMENT
  ACTIVITY
}

enum ExamStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  CLOSED
}
```

---

## Models

### User

The central model. Every person in the system is a User.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `email` | String (unique) | Login email |
| `passwordHash` | String | bcrypt hash |
| `role` | RoleType | ADMIN, IMPLEMENTOR, CADET_OFFICER, STUDENT |
| `isActive` | Boolean | Account enabled/disabled |
| `avatarUrl` | String? | Base64 data URI of profile photo |
| `avatarFrame` | String? | Selected frame style (default: "gradient") |
| `createdAt` | DateTime | Account creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |
| `deletedAt` | DateTime? | Soft delete timestamp |

**Relations:**
- Has one `StudentProfile`, `ImplementorProfile`, or `CadetOfficerProfile`
- Has many `Enrollment`, `AttendanceRecord`, `StudentGrade`, `MeritDemerit`, `ExamAttempt`, `AuditLog`

---

### StudentProfile

Extended profile for students.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String (unique) | FK → User |
| `studentNo` | String? (unique) | Student ID number |
| `firstName` | String | First name |
| `lastName` | String | Last name |
| `middleName` | String? | Middle name |
| `birthDate` | DateTime? | Date of birth |
| `gender` | String? | Gender |
| `contactNo` | String? | Phone number |
| `address` | String? | Home address |
| `sectionId` | String? | FK → Section |
| `flightId` | String? | FK → Flight |

---

### ImplementorProfile

Extended profile for implementors (instructors).

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String (unique) | FK → User |
| `firstName` | String | First name |
| `lastName` | String | Last name |
| `contactNo` | String? | Phone number |

---

### CadetOfficerProfile

Extended profile for cadet officers.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String (unique) | FK → User |
| `firstName` | String | First name |
| `lastName` | String | Last name |
| `contactNo` | String? | Phone number |

---

### Section

Organizational unit grouping students.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `code` | String (unique) | Short code (e.g., "SEC-A") |
| `name` | String | Full name |

**Relations:** Has many `StudentProfile`, `Enrollment`, `LearningMaterial`, `ExamSession`, `AttendanceSession`

---

### Flight

Sub-organizational unit within a section.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `code` | String (unique) | Short code (e.g., "FLT-1") |
| `name` | String | Full name |

**Relations:** Same as Section

---

### Enrollment

Tracks a student's enrollment request and assignment.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String | FK → User (student) |
| `sectionId` | String? | FK → Section (assigned) |
| `flightId` | String? | FK → Flight (assigned) |
| `status` | EnrollmentStatus | PENDING, APPROVED, REJECTED |

---

### AttendanceSession

A scheduled attendance event created by a host.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `title` | String | Session name |
| `date` | DateTime | Session date |
| `startTime` | DateTime | Start time |
| `endTime` | DateTime? | End time |
| `hostId` | String | FK → User (host) |
| `hostLatitude` | Float? | Host GPS latitude |
| `hostLongitude` | Float? | Host GPS longitude |
| `verifierId` | String? | FK → User (verifier) |
| `verifierLatitude` | Float? | Verifier GPS latitude |
| `verifierLongitude` | Float? | Verifier GPS longitude |
| `radiusMeters` | Int | Allowed check-in radius (default: 50m) |
| `requireVerifier` | Boolean | Whether verifier is required |
| `isActive` | Boolean | Session open/closed |
| `sectionId` | String? | FK → Section |
| `flightId` | String? | FK → Flight |

---

### AttendanceRecord

Individual student attendance entry.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String | FK → User (student) |
| `date` | DateTime | Attendance date |
| `checkInAt` | DateTime? | Check-in timestamp |
| `checkOutAt` | DateTime? | Check-out timestamp |
| `latitude` | Float? | Student GPS latitude at check-in |
| `longitude` | Float? | Student GPS longitude at check-in |
| `status` | AttendanceStatus | PRESENT, LATE, ABSENT |
| `sessionId` | String? | FK → AttendanceSession |
| `verifiedBy` | String? | Verifier user ID |

**Unique constraint:** `[userId, date]` — one record per student per day.

---

### GradeCategory

Top-level grouping for grade items (e.g., "Quizzes", "Projects").

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `name` | String | Category name |
| `weight` | Float? | Weight percentage |

---

### GradeItem

A specific graded activity within a category.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `title` | String | Item name |
| `maxScore` | Float | Maximum possible score |
| `categoryId` | String | FK → GradeCategory |

---

### StudentGrade

A student's score on a specific grade item.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `studentId` | String | FK → User (student) |
| `gradeItemId` | String | FK → GradeItem |
| `score` | Float | Actual score |
| `encodedById` | String | FK → User (encoder) |

---

### MeritDemerit

Merit or demerit record for a student.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `studentId` | String | FK → User (student) |
| `type` | MeritType | MERIT or DEMERIT |
| `points` | Int | Point value |
| `reason` | String | Reason description |
| `encodedById` | String | FK → User (encoder) |

---

### ExamSession

A scheduled exam event.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `title` | String | Exam title |
| `description` | String? | Description |
| `durationMin` | Int | Duration in minutes |
| `scheduledAt` | DateTime | Scheduled date/time |
| `status` | ExamStatus | DRAFT, SCHEDULED, ACTIVE, CLOSED |
| `sectionId` | String? | FK → Section |
| `flightId` | String? | FK → Flight |

---

### ExamAttempt

A student's attempt at an exam session.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `examSessionId` | String | FK → ExamSession |
| `studentId` | String | FK → User |
| `startedAt` | DateTime? | When student started |
| `endedAt` | DateTime? | When student finished |
| `focusLosses` | Int | Number of tab/window switches |
| `violations` | Int | Number of violations |
| `isLocked` | Boolean | Whether attempt is locked |

---

### MonitoringLog

Individual monitoring event during an exam attempt.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `examAttemptId` | String | FK → ExamAttempt |
| `event` | String | Event description |
| `createdAt` | DateTime | Timestamp |

---

### LearningMaterial

Uploaded learning resource.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `title` | String | Material title |
| `description` | String? | Description |
| `category` | MaterialCategory | MODULE, LECTURE, ANNOUNCEMENT, ACTIVITY |
| `fileUrl` | String? | Path to uploaded file |
| `createdById` | String | FK → User (creator) |
| `sectionId` | String? | FK → Section |
| `flightId` | String? | FK → Flight |

---

### AuditLog

System-wide audit trail.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `actorId` | String? | FK → User (who did it) |
| `action` | String | Action type (CREATE, UPDATE, DELETE, LOGIN) |
| `entity` | String | Model name |
| `entityId` | String? | ID of affected record |
| `meta` | Json? | Additional context |
| `createdAt` | DateTime | Timestamp |

---

## Entity Relationship Diagram

```
User ──────────────────────────────────────────────────────────
  │                                                            │
  ├── StudentProfile ──── Section ──── Flight                 │
  │         │                                                  │
  ├── ImplementorProfile                                       │
  │                                                            │
  ├── CadetOfficerProfile                                      │
  │                                                            │
  ├── Enrollment ──── Section ──── Flight                     │
  │                                                            │
  ├── AttendanceRecord ──── AttendanceSession ─── Section     │
  │                                                            │
  ├── StudentGrade ──── GradeItem ──── GradeCategory          │
  │                                                            │
  ├── MeritDemerit                                             │
  │                                                            │
  ├── ExamAttempt ──── ExamSession ──── Section               │
  │         │                                                  │
  │         └── MonitoringLog                                  │
  │                                                            │
  ├── LearningMaterial ──── Section ──── Flight               │
  │                                                            │
  └── AuditLog ─────────────────────────────────────────────┘
```
