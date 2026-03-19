# Features

---

## Enrollment Management

Students register and submit enrollment requests. Administrators and implementors review and process them.

**Workflow:**
1. Student registers an account (role: STUDENT)
2. An enrollment record is automatically created with status `PENDING`
3. Admin/Implementor reviews the request
4. Admin/Implementor approves and assigns the student to a Section and Flight
5. Student's enrollment status becomes `APPROVED`

**Statuses:** `PENDING` → `APPROVED` or `REJECTED`

---

## Attendance System

Location-based attendance tracking using GPS coordinates.

### Attendance Sessions

An instructor creates an **Attendance Session** which defines:
- Date and time window
- GPS coordinates of the host location
- Allowed radius in meters (default: 50m)
- Optional verifier requirement

### Check-in Flow

1. Instructor creates a session and shares the session ID
2. Student opens the attendance page and clicks "Check In"
3. Browser requests GPS coordinates
4. Frontend sends coordinates to the server
5. Server calculates distance from host using the **Haversine formula**
6. If within radius → attendance marked as `PRESENT`
7. If late (after session start + grace period) → marked as `LATE`

### Location Verification

The Haversine formula calculates the great-circle distance between two GPS points:

```
d = 2r × arcsin(√(sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)))
```

This ensures students must physically be at the location to check in.

### Attendance History

- Students see their own attendance history with date, status, and GPS coordinates
- Coordinates link to Google Maps for verification
- Admins/Implementors see all records with filtering

---

## Grading System

Hierarchical grade management with categories, items, and student scores.

### Structure

```
GradeCategory (e.g., "Quizzes" — 30% weight)
  └── GradeItem (e.g., "Quiz 1" — max 50 points)
        └── StudentGrade (e.g., Juan Dela Cruz — 45/50)
```

### Features

- Create categories with optional weight percentages
- Create grade items with maximum scores
- Encode individual student scores
- Edit and delete grades
- Students see their own grades only (no Actions column)
- Tabbed interface: Grades | Items | Categories

---

## Merit & Demerit System

Track positive and negative behavior points for students.

**Merit:** Positive recognition (e.g., outstanding performance)
**Demerit:** Negative record (e.g., tardiness, misconduct)

Each record includes:
- Student
- Type (MERIT or DEMERIT)
- Points
- Reason/description
- Encoder and timestamp

---

## Exam Management

Create and manage exam sessions with anti-cheat monitoring.

### Exam Session Lifecycle

```
DRAFT → SCHEDULED → ACTIVE → CLOSED
```

### Anti-Cheat Monitoring

During an active exam attempt, the system monitors:
- **Focus losses**: Tab switches or window minimization
- **Violations**: Other suspicious behaviors
- **Monitoring logs**: Timestamped event log per attempt

Students are warned about monitoring before starting. Excessive violations can lock the attempt.

### Exam Attempt Flow

1. Admin creates exam session (DRAFT)
2. Admin schedules it (SCHEDULED)
3. Admin activates it (ACTIVE)
4. Students start their attempt
5. System logs monitoring events
6. Student submits or time expires
7. Admin closes session (CLOSED)

---

## Learning Materials

Upload and organize educational resources for students.

### Categories

| Category | Description |
|---|---|
| `MODULE` | Course modules and reading materials |
| `LECTURE` | Lecture notes and presentations |
| `ANNOUNCEMENT` | Program announcements |
| `ACTIVITY` | Activity instructions and worksheets |

### Features

- Upload PDF and other file types
- Assign materials to specific sections or flights
- Students can view and download materials assigned to their section/flight
- "View File" button opens the file in a new tab
- File icon indicator for materials with attachments

---

## Profile Management

Each user can manage their own profile.

### Editable Fields

| Field | Roles |
|---|---|
| First name, Last name | All |
| Middle name | STUDENT |
| Gender | STUDENT |
| Birth date | STUDENT |
| Contact number | All |
| Address | STUDENT |

### Non-Editable Fields

| Field | Reason |
|---|---|
| Email | Permanent identifier |
| Role | Assigned by administrator |
| Student ID No. | Permanent identifier |

### Profile Photo

- Upload a photo using the camera button
- Image is cropped using the built-in cropper (zoom + rotation controls)
- Stored as base64 JPEG in the database (max ~300KB)
- Remove photo with the trash button

### Avatar Frames

Users can choose from 5 decorative frame styles for their profile picture:

| Frame | Description |
|---|---|
| `none` | Clean, no frame |
| `gradient` | Smooth gradient ring (default) |
| `double` | Two-layer border |
| `glow` | Neon glow effect |
| `hexagon` | Hexagonal clip path |

Frame colors are based on user role:
- Admin → Violet
- Implementor → Sky blue
- Cadet Officer → Amber
- Student → Emerald

The selected frame is displayed consistently in:
- Profile page
- Sidebar user card
- Topbar user pill

### DiceBear Avatar Fallback

When no photo is uploaded, the system generates a unique avatar using the [DiceBear API](https://dicebear.com) based on the user's email address. This ensures every user always has a visual identity.

---

## Dashboard

Overview page with key statistics and recent activity.

### Widgets

- Total students enrolled
- Attendance summary (present/late/absent rates)
- Recent enrollment requests
- Grade overview
- Merit/demerit summary
- Charts powered by Recharts

---

## Sections & Flights

Organizational units for grouping students.

**Section:** Top-level group (e.g., "Section Alpha")
**Flight:** Sub-group within a section (e.g., "Flight 1")

Students are assigned to both a section and a flight during enrollment approval. Materials, attendance sessions, and exams can be targeted to specific sections or flights.

---

## User Management

Admin-only feature for managing all system users.

- Create new users with any role
- Edit user details
- Enable/disable accounts (`isActive` flag)
- Delete users (soft delete)

---

## Reports

Available to ADMIN, IMPLEMENTOR, and CADET_OFFICER roles.

- Attendance reports by date range, section, flight
- Grade reports with category breakdowns
- Merit/demerit summaries
- Enrollment statistics
- Export capabilities

---

## Audit Logging

Every significant action is recorded in the `AuditLog` table:

| Action | Trigger |
|---|---|
| `CREATE` | New user, enrollment, grade, etc. |
| `UPDATE` | Profile update, grade edit, etc. |
| `DELETE` | Record deletion |
| `LOGIN` | Successful login |

Each log entry records:
- Who performed the action (`actorId`)
- What action was performed
- Which entity was affected
- Timestamp
