# Deployment Status & Final Configuration

## Current Status

### ✅ GitHub Repository
- Repository: https://github.com/carlkelvin8/Tala.git
- Latest commit: e53659e
- All code pushed successfully

### 🔄 Vercel (Frontend)
- Status: Building
- Building from commit: 19ab438 (older commit, but frontend code is same)
- Expected URL: `https://tala-[random].vercel.app`

### ⚠️ Railway (Backend)
- Status: Needs configuration
- Issue: Missing environment variables causing crashes

## Required Actions

### 1. Configure Railway Backend (URGENT)

**Go to**: Railway Dashboard → Your Service → Variables

**Add these variables**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_g6k9bYASzWlq@ep-summer-hall-a747xxsd-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `JWT_ACCESS_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Generate again (different from above) |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `*` (change after Vercel deploys) |

**After adding variables**: Click "Deploy" to trigger redeploy

### 2. Configure Vercel Frontend

**Once Vercel build completes**:

1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-railway-url.up.railway.app` (get from Railway)
3. Redeploy: Deployments → ... → Redeploy

### 3. Update CORS (After Both Deploy)

**Once you have Vercel URL**:

1. Go to Railway → Variables
2. Update `CORS_ORIGIN` from `*` to your Vercel URL:
   ```
   CORS_ORIGIN=https://tala-abc123.vercel.app
   ```
3. Redeploy Railway

## Testing Deployment

### Test Backend (Railway)

```bash
# Should return: {"success":true,"message":"NSTP API running"}
curl https://your-railway-url.up.railway.app/

# Test health check
curl https://your-railway-url.up.railway.app/api/auth/health
```

### Test Frontend (Vercel)

1. Visit: `https://your-vercel-url.vercel.app`
2. Try to login with:
   - Email: `admin@nstp.edu`
   - Password: `admin123`

### Test Integration

1. Open browser DevTools (F12) → Network tab
2. Try to login
3. Check if API calls go to Railway backend
4. Should see successful responses (200 status)

## Troubleshooting

### Backend Still Crashing?

**Check Deploy Logs**:
1. Railway → Your Service → Deployments → Latest
2. Click "Deploy Logs" tab
3. Look for error message

**Common errors**:
- "Can't reach database" → Check DATABASE_URL
- "Cannot find module" → Rebuild (Settings → Redeploy)
- "EADDRINUSE" → Port conflict (restart service)

### Frontend Can't Connect to Backend?

**Check**:
1. Is `VITE_API_URL` set in Vercel?
2. Is Railway backend running? (check logs)
3. Is CORS configured correctly?
4. Open browser console for error messages

### CORS Errors?

**Symptoms**: "Access-Control-Allow-Origin" error in browser console

**Fix**:
1. Update Railway `CORS_ORIGIN` to include Vercel URL
2. Format: `https://your-app.vercel.app` (no trailing slash)
3. For multiple: `https://app1.com,https://app2.com`

## Default Users (After Deployment)

Once backend is running, seed the database:

**Option 1 - Railway Shell**:
```bash
cd backend
npx prisma db seed
```

**Option 2 - Local then migrate**:
```bash
# Set DATABASE_URL locally
cd backend
npx prisma db seed
```

**Default accounts**:
- Admin: `admin@nstp.edu` / `admin123`
- Implementor: `implementor@nstp.edu` / `impl123`
- Cadet Officer: `officer@nstp.edu` / `officer123`
- Student: `student@nstp.edu` / `student123`

## URLs Reference

| Service | URL | Status |
|---------|-----|--------|
| GitHub | https://github.com/carlkelvin8/Tala.git | ✅ Active |
| Railway Backend | `https://[your-service].up.railway.app` | ⚠️ Needs config |
| Vercel Frontend | `https://tala-[random].vercel.app` | 🔄 Building |
| Neon Database | `ep-summer-hall-a747xxsd-pooler.ap-southeast-2.aws.neon.tech` | ✅ Active |

## Next Steps

1. ✅ Code is pushed to GitHub
2. ⏳ Wait for Vercel build to complete
3. ⚠️ Add environment variables to Railway
4. ⏳ Wait for Railway to deploy successfully
5. 🔧 Add `VITE_API_URL` to Vercel
6. 🔧 Update Railway `CORS_ORIGIN` with Vercel URL
7. ✅ Test the application
8. 🎉 Deploy complete!

## Support

- Railway Docs: https://docs.railway.app/
- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Neon Docs: https://neon.tech/docs

For detailed troubleshooting, see:
- `RAILWAY_TROUBLESHOOTING.md`
- `VERCEL_DEPLOYMENT.md`
- `DEPLOYMENT.md`
