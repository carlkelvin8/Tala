# Overview

**Kalasag-Tala NSTP Command Center** is a full-stack web application designed to streamline the administration of the National Service Training Program. It provides a centralized platform for managing students, attendance, grades, exams, learning materials, and more.

---

## What It Does

The system handles the complete lifecycle of an NSTP program:

- Students register and submit enrollment requests
- Administrators approve enrollments and assign students to sections and flights
- Instructors (Implementors and Cadet Officers) manage attendance, grades, and materials
- Students access their records, learning materials, and exam schedules
- Administrators generate reports and manage all users

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Hono | Lightweight web framework |
| TypeScript | Type safety |
| Prisma ORM | Database access layer |
| PostgreSQL (Neon) | Serverless relational database |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| Zod | Request validation |

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| TailwindCSS | Utility-first styling |
| React Router v6 | Client-side routing |
| TanStack Query v5 | Server state management |
| React Hook Form | Form handling |
| Zod | Form validation schemas |
| Recharts | Data visualization |
| Framer Motion | Animations |
| Lucide React | Icon library |
| Sonner | Toast notifications |

---

## User Roles

The system has four distinct roles with different levels of access:

| Role | Description |
|---|---|
| `ADMIN` | Full system access — manages users, reports, all data |
| `IMPLEMENTOR` | Manages students, materials, grades, attendance |
| `CADET_OFFICER` | Manages attendance, grades, merits for their section |
| `STUDENT` | Views own records, submits attendance, takes exams |

---

## Project Structure

```
kalasag-tala/
├── backend/                  # Hono API server
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── seed.ts           # Database seeder
│   │   └── migrations/       # Migration history
│   └── src/
│       ├── app.ts            # Hono app setup, routes, CORS
│       ├── server.ts         # HTTP server entry point
│       ├── controllers/      # Request handlers
│       ├── services/         # Business logic
│       ├── repositories/     # Data access layer
│       ├── routes/           # Route definitions
│       ├── middlewares/      # Auth, error handling, validation
│       ├── validators/       # Zod schemas
│       ├── lib/              # Utilities (JWT, password, response)
│       └── types/            # TypeScript types
│
└── frontend/                 # React SPA
    └── src/
        ├── App.tsx           # Route definitions
        ├── pages/            # Page-level components
        ├── components/
        │   ├── auth/         # Login and register pages
        │   ├── layout/       # Sidebar, topbar, app layout
        │   └── ui/           # Reusable UI components
        ├── lib/              # API client, auth helpers, utilities
        └── types/            # Shared TypeScript types
```
