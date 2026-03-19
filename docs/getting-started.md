# Getting Started

This guide walks you through setting up the project locally for development.

---

## Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or higher
- **npm** v9 or higher
- **PostgreSQL** database (or a [Neon](https://neon.tech) serverless PostgreSQL account)
- **Git**

---

## 1. Clone the Repository

```bash
git clone https://github.com/carlkelvin8/Tala.git
cd Tala
```

---

## 2. Backend Setup

### Install dependencies

```bash
cd backend
npm install
```

### Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
JWT_SECRET="your-secret-key-minimum-32-characters"
PORT=4000
NODE_ENV=development
```

> For Neon PostgreSQL, copy the connection string from your Neon dashboard.

### Run database migrations

```bash
npx prisma migrate dev
```

### Generate Prisma client

```bash
npx prisma generate
```

### Seed the database

```bash
npm run seed
```

This creates default accounts for testing. See [Default Accounts](#default-accounts) below.

### Start the development server

```bash
npm run dev
```

The backend will be available at `http://localhost:4000`.

---

## 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

### Configure environment variables

```bash
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:4000
```

### Start the development server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Default Accounts

After seeding, the following accounts are available:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@nstp.local` | `Password123!` |
| Implementor | `implementor@nstp.local` | `Password123!` |
| Cadet Officer | `officer@nstp.local` | `Password123!` |
| Student | `student@nstp.local` | `Password123!` |

> Students can also log in using their student number instead of email.

---

## Available Scripts

### Backend

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production server |
| `npm run migrate` | Run Prisma migrations |
| `npm run seed` | Seed the database |
| `npm run generate` | Regenerate Prisma client |

### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript type checking |

---

## Verify Setup

1. Open `http://localhost:5173` in your browser
2. You should see the login page
3. Log in with `admin@nstp.local` / `Password123!`
4. You should be redirected to the dashboard

If you see any errors, check:
- Backend is running on port 4000
- `VITE_API_URL` in frontend `.env.local` matches the backend port
- Database connection string is correct
- Migrations have been applied
