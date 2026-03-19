# Deployment

---

## Overview

The recommended deployment setup:

| Service | Platform |
|---|---|
| Backend API | Railway |
| Frontend SPA | Netlify |
| Database | Neon (serverless PostgreSQL) |

---

## Database — Neon

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Use this as `DATABASE_URL` in your backend environment

---

## Backend — Railway

### Setup

1. Create an account at [railway.app](https://railway.app)
2. Create a new project → "Deploy from GitHub repo"
3. Select your repository
4. Set the root directory to `backend`

### Environment Variables

In Railway dashboard → Variables, add:

```env
DATABASE_URL=postgresql://...your-neon-connection-string...
JWT_SECRET=your-minimum-32-character-secret-key
PORT=4000
NODE_ENV=production
```

### Build & Start Commands

Railway will detect these from `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### Run Migrations on Deploy

After first deploy, run migrations via Railway CLI or the dashboard shell:

```bash
npx prisma migrate deploy
```

> Use `migrate deploy` (not `migrate dev`) in production — it applies pending migrations without creating new ones.

### Domain

Railway provides a public URL like `https://your-app.railway.app`. Use this as `VITE_API_URL` in the frontend.

---

## Frontend — Netlify

### Setup

1. Create an account at [netlify.com](https://netlify.com)
2. "Add new site" → "Import an existing project" → GitHub
3. Select your repository

### Build Settings

| Setting | Value |
|---|---|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `frontend/dist` |

### Environment Variables

In Netlify dashboard → Site settings → Environment variables:

```env
VITE_API_URL=https://your-backend.railway.app
```

### Redirects

Create `frontend/public/_redirects` to handle client-side routing:

```
/*    /index.html   200
```

This ensures React Router works correctly on page refresh.

---

## CORS Configuration

The backend's CORS configuration in `backend/src/app.ts` must include your Netlify domain:

```typescript
cors({
  origin: [
    "https://your-app.netlify.app",   // Add your Netlify URL
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
})
```

After updating, rebuild and redeploy the backend.

---

## Production Checklist

Before going live:

- [ ] `JWT_SECRET` is a strong random string (32+ characters)
- [ ] `NODE_ENV=production` is set on backend
- [ ] Database migrations have been applied (`prisma migrate deploy`)
- [ ] CORS origins include the production frontend URL
- [ ] `VITE_API_URL` points to the production backend URL
- [ ] Frontend `_redirects` file is in place
- [ ] Default seed accounts have been changed or removed
- [ ] Database is backed up

---

## Local Production Build Test

Test the production build locally before deploying:

```bash
# Backend
cd backend
npm run build
npm run start

# Frontend (in another terminal)
cd frontend
npm run build
npm run preview
```

---

## Environment Files Summary

### `backend/.env` (development)

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/nstp"
JWT_SECRET="dev-secret-key-change-in-production"
PORT=4000
NODE_ENV=development
```

### `frontend/.env.local` (development)

```env
VITE_API_URL=http://localhost:4000
```

### `frontend/.env.production` (production build)

```env
VITE_API_URL=https://your-backend.railway.app
```
