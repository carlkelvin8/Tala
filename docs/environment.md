# Environment Variables

---

## Backend

File: `backend/.env`

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `TEST_DATABASE_URL` | For tests | Dedicated disposable PostgreSQL database used by `npm test` | `postgresql://user:pass@host:5432/db_test?sslmode=require` |
| `JWT_ACCESS_SECRET` | Yes | Secret key for signing access tokens | `random-secret-at-least-32-characters` |
| `JWT_REFRESH_SECRET` | Yes | Separate secret for signing refresh tokens | `different-random-secret-at-least-32-characters` |
| `QR_TOKEN_SECRET` | Yes | Separate secret for attendance QR tokens | `another-random-secret-at-least-32-characters` |
| `PORT` | No | HTTP server port (default: 4000) | `4000` |
| `NODE_ENV` | No | Environment mode | `development` or `production` |
| `CORS_ORIGIN` | Yes (prod) | Comma-separated list of allowed frontend origins | `https://app.example.com,http://localhost:5173` |
| `ALLOW_VERCEL_PREVIEW_ORIGINS` | No | When `true`, allows any `*-carlkelvin8s-projects.vercel.app` origin (preview/staging deploys) | `true` |

### Notes

- Each secret should be unique and at least 32 characters in production. Use a random generator:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `DATABASE_URL` for Neon must include `?sslmode=require`
- `npm test` prefers `TEST_DATABASE_URL` when present because integration tests create and delete records. Never point it at production.
- The seed script (`npm run seed`) refuses to run against a non-localhost database unless `FORCE_SEED=true` is set — this protects production data from accidental wipes.
- Never commit `.env` to version control

---

## Frontend

File: `frontend/.env.local` (development) or `frontend/.env.production` (production)

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL | `http://localhost:4000` |

### Notes

- Vite only exposes variables prefixed with `VITE_` to the browser
- `.env.local` is gitignored by default
- In production, set `VITE_API_URL` to your deployed backend URL

---

## Example Files

### `backend/.env.example`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/nstp_db"
JWT_ACCESS_SECRET="change-this-to-a-random-32-char-string"
JWT_REFRESH_SECRET="use-a-different-random-32-char-string"
QR_TOKEN_SECRET="use-another-random-32-char-string"
PORT=4000
NODE_ENV=development
```

### `frontend/.env.example`

```env
VITE_API_URL=http://localhost:4000
```

---

## Staging / Preview Workflow

- **Frontend**: push to any branch → Vercel auto-creates a preview deployment (Git integration). The `master` branch deploys to production (`tala-frontend-tau.vercel.app`).
- **Backend**: deploys are manual via Vercel CLI:
  ```bash
  cd backend
  vercel          # preview deployment (staging URL)
  vercel --prod   # production deployment
  ```
- Preview/staging frontend origins are accepted by the backend CORS when `ALLOW_VERCEL_PREVIEW_ORIGINS=true`.
- Use a **separate database** for staging when possible; never run the seed against production without `FORCE_SEED=true`.
