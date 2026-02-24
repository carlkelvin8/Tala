# NSTP Management System (Tala)

A comprehensive management system for NSTP (National Service Training Program) with features for enrollment, attendance, grades, exams, materials, and more.

## Tech Stack

### Backend
- Node.js with Hono framework
- PostgreSQL with Prisma ORM
- Neon PostgreSQL (serverless)
- JWT authentication
- TypeScript

### Frontend
- React with TypeScript
- Vite
- TailwindCSS
- React Query
- React Router
- Shadcn UI components

## Features

- User authentication and authorization (Admin, Implementor, Cadet Officer, Student roles)
- Student enrollment management
- Attendance tracking
- Grade management with categories and items
- Exam management with camera monitoring
- Learning materials upload and management
- Merit and demerit system
- Comprehensive reporting and exports
- Real-time UI updates
- Profile management with avatar upload
- Flight and section organization

## Deployment on Railway

### Backend Deployment

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add a PostgreSQL database service (or use Neon connection string)
4. Set environment variables:
   ```
   DATABASE_URL=your_neon_or_railway_postgres_url
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
   NODE_ENV=production
   ```
5. Railway will automatically detect the `nixpacks.toml` configuration
6. Deploy the backend service

### Frontend Deployment

For the frontend, you have two options:

#### Option 1: Deploy on Vercel/Netlify
1. Create a new project
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable:
   ```
   VITE_API_URL=your_backend_railway_url
   ```

#### Option 2: Serve from Backend (Static Files)
The backend is already configured to serve static files from `frontend/dist` in production.

1. Build the frontend locally:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. The backend will serve the frontend from `/` route

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="your_neon_postgres_connection_string"
JWT_SECRET="your_secret_key_here"
PORT=3000
NODE_ENV=production
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

## Local Development

### Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Database Schema

The system uses Prisma ORM with the following main models:
- User (with different roles)
- Student (extended user profile)
- Flight & Section (organizational units)
- Enrollment
- Attendance
- Grade, GradeCategory, GradeItem
- Exam
- Material
- Merit
- AuditLog

## Default Users

After seeding the database:
- Admin: admin@nstp.edu / admin123
- Implementor: implementor@nstp.edu / impl123
- Cadet Officer: officer@nstp.edu / officer123
- Student: student@nstp.edu / student123

## License

Private - All rights reserved
