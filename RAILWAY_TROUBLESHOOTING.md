# Railway Backend Troubleshooting Guide

## Common Crash Causes and Solutions

### 1. Missing Environment Variables

**Symptoms**: Backend crashes immediately on startup

**Solution**: Ensure ALL these environment variables are set in Railway:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_g6k9bYASzWlq@ep-summer-hall-a747xxsd-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_ACCESS_SECRET=<generate-with-command-below>

JWT_REFRESH_SECRET=<generate-with-command-below>

PORT=3000

NODE_ENV=production

CORS_ORIGIN=*
```

**Generate JWT Secrets**:
```bash
# Run this twice to get two different secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Database Connection Issues

**Symptoms**: "Can't reach database server" or "Connection timeout"

**Check**:
- Is your Neon database active?
- Is the DATABASE_URL correct?
- Does it include `?sslmode=require`?

**Test Connection**:
```bash
# In Railway shell or locally
npx prisma db pull
```

### 3. Prisma Client Not Generated

**Symptoms**: "Cannot find module '@prisma/client'"

**Solution**: The build process should handle this, but if it fails:
1. Check Build Logs for errors during `npx prisma generate`
2. Ensure `@prisma/client` is in dependencies (not devDependencies)

### 4. Migration Failures

**Symptoms**: "Migration failed" or "Table already exists"

**Solutions**:

**Option A - Reset and Migrate** (if no production data):
```bash
# In Railway shell
cd backend
npx prisma migrate reset --force
npx prisma migrate deploy
```

**Option B - Skip Migrations** (if database is already set up):
Update `nixpacks.toml` start command to:
```toml
[start]
cmd = "cd backend && node dist/server.js"
```

### 5. Build Failures

**Symptoms**: Build fails during TypeScript compilation

**Check**:
- Build Logs for TypeScript errors
- Ensure all imports use `.js` extension (ES modules)
- Verify tsconfig.json is correct

**Quick Fix**:
```bash
# Test build locally
cd backend
npm run build
```

### 6. Port Binding Issues

**Symptoms**: "Port already in use" or "EADDRINUSE"

**Solution**: Railway automatically sets the PORT variable. Ensure your code uses it:
```typescript
// backend/src/lib/env.ts should have:
port: Number(process.env.PORT ?? 4000)
```

## Step-by-Step Deployment Checklist

### Before Deploying:

- [ ] All environment variables are set in Railway
- [ ] DATABASE_URL is correct and accessible
- [ ] JWT secrets are generated and set
- [ ] Latest code is pushed to GitHub

### After Deployment:

1. **Check Build Logs**:
   - Go to Railway → Your Service → Deployments → Click on latest deployment
   - Check "Build Logs" tab for errors

2. **Check Deploy Logs**:
   - Switch to "Deploy Logs" tab
   - Look for startup errors or crash messages

3. **Test Database Connection**:
   - In Deploy Logs, look for "Running database migrations..."
   - Should see "Starting server on port 3000..."

4. **Test API Endpoint**:
   - Visit: `https://your-railway-url.up.railway.app/`
   - Should return: `{"success":true,"message":"NSTP API running"}`

## Manual Deployment Steps

If automatic deployment fails, try manual steps:

### 1. Connect to Railway Shell

In Railway dashboard:
- Click on your service
- Click "Shell" or use Railway CLI

### 2. Run Commands Manually

```bash
# Navigate to backend
cd backend

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Build TypeScript
npm run build

# Run migrations
npx prisma migrate deploy

# Start server
node dist/server.js
```

### 3. Check for Errors

Each command should complete without errors. Note which step fails.

## Common Error Messages

### "Error: P1001: Can't reach database server"
- Check DATABASE_URL
- Verify Neon database is active
- Check network/firewall settings

### "Error: Cannot find module '@prisma/client'"
- Run `npx prisma generate`
- Check if @prisma/client is in package.json dependencies

### "Error: ENOENT: no such file or directory, open 'dist/server.js'"
- Build failed or didn't run
- Check Build Logs
- Manually run `npm run build`

### "Error: listen EADDRINUSE: address already in use"
- Port conflict (rare on Railway)
- Check if multiple instances are running
- Restart the service

### "TypeError: Cannot read properties of undefined"
- Missing environment variable
- Check all required vars are set
- Check env.ts for defaults

## Getting Help

### View Logs:
```bash
# Railway CLI
railway logs

# Or in dashboard: Service → Deployments → Deploy Logs
```

### Check Service Status:
```bash
railway status
```

### Restart Service:
```bash
railway restart
```

## Quick Fixes

### Force Redeploy:
1. Go to Railway dashboard
2. Click on your service
3. Settings → Redeploy

### Clear Build Cache:
1. Delete the service
2. Create new service from GitHub
3. Set environment variables again
4. Deploy

### Use Different Start Command:

In Railway settings, override start command:
```bash
cd backend && npx prisma migrate deploy && node dist/server.js
```

## Contact Information

If issues persist:
1. Check Railway status page: https://status.railway.app/
2. Railway Discord: https://discord.gg/railway
3. Check GitHub issues for similar problems
