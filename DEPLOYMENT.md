# Railway Deployment Guide

## Step 1: Configure Railway Project

1. Go to your Railway dashboard: https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose the `carlkelvin8/Tala` repository
5. Railway will automatically detect the configuration from `nixpacks.toml`

## Step 2: Set Environment Variables

In your Railway project settings, add these environment variables:

### Required Variables:
```
DATABASE_URL=postgresql://neondb_owner:npg_g6k9bYASzWlq@ep-summer-hall-a747xxsd-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars

JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

PORT=3000

NODE_ENV=production

CORS_ORIGIN=*
```

### Generate Secure JWT Secrets:
You can generate secure secrets using Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice to get two different secrets for ACCESS and REFRESH tokens.

## Step 3: Deploy

1. Railway will automatically start building and deploying
2. Wait for the build to complete (check Build Logs)
3. Once deployed, Railway will provide a public URL (e.g., `https://tala-production.up.railway.app`)

## Step 4: Run Database Migrations

The deployment automatically runs `npx prisma migrate deploy` on startup (configured in `nixpacks.toml`).

If you need to run migrations manually:
1. Go to your Railway project
2. Click on the service
3. Go to "Settings" → "Deploy"
4. Add a custom start command: `npx prisma migrate deploy && npm run start`

## Step 5: Seed the Database (Optional)

To add default users and test data:

1. In Railway, go to your service
2. Click "Settings" → "Variables"
3. Add a new variable temporarily: `RUN_SEED=true`
4. Redeploy the service
5. After deployment, remove the `RUN_SEED` variable

Or connect to the database directly and run:
```bash
cd backend
npx prisma db seed
```

## Step 6: Update Frontend Configuration

If you're deploying the frontend separately (Vercel/Netlify):

1. Create a new project on Vercel/Netlify
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable:
   ```
   VITE_API_URL=https://your-railway-backend-url.up.railway.app
   ```

## Troubleshooting

### Build Fails
- Check Build Logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify `nixpacks.toml` configuration

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if Neon database is active
- Ensure SSL mode is set correctly

### CORS Errors
- Update `CORS_ORIGIN` to include your frontend URL
- For multiple origins: `CORS_ORIGIN=https://frontend1.com,https://frontend2.com`
- For development: `CORS_ORIGIN=*` (not recommended for production)

### Migration Errors
- Check if database is accessible
- Verify Prisma schema is correct
- Run migrations manually if needed

## Monitoring

- Check Deploy Logs for runtime errors
- Monitor Network Flow Logs for API requests
- Set up alerts in Railway settings

## Updating the Deployment

1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. Railway will automatically detect changes and redeploy

## Custom Domain (Optional)

1. Go to Railway project settings
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `CORS_ORIGIN` to include your custom domain
