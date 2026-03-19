# Environment Variables

---

## Backend

File: `backend/.env`

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | Yes | Secret key for signing JWTs | `super-secret-key-min-32-chars` |
| `PORT` | No | HTTP server port (default: 4000) | `4000` |
| `NODE_ENV` | No | Environment mode | `development` or `production` |

### Notes

- `JWT_SECRET` should be at least 32 characters in production. Use a random generator:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `DATABASE_URL` for Neon must include `?sslmode=require`
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
JWT_SECRET="change-this-to-a-random-32-char-string"
PORT=4000
NODE_ENV=development
```

### `frontend/.env.example`

```env
VITE_API_URL=http://localhost:4000
```
