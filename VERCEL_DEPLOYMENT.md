# Vercel Frontend Deployment Guide

## Quick Setup

### Step 1: Configure Vercel Project Settings

In your Vercel project settings:

1. **Root Directory**: Leave as `.` (root) or set to `frontend`
2. **Framework Preset**: Vite
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### Step 2: Add Environment Variable

Go to Project Settings → Environment Variables and add:

```
VITE_API_URL=https://your-railway-backend-url.up.railway.app
```

**Important**: Replace `your-railway-backend-url.up.railway.app` with your actual Railway backend URL.

To find your Railway backend URL:
1. Go to Railway dashboard
2. Click on your backend service
3. Go to "Settings" → "Domains"
4. Copy the generated Railway domain (e.g., `tala-production.up.railway.app`)

### Step 3: Update Railway CORS Settings

After deploying to Vercel, update your Railway backend environment variables:

```
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

Or allow multiple origins:
```
CORS_ORIGIN=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

### Step 4: Redeploy

1. Vercel will automatically redeploy when you push to GitHub
2. Or manually trigger a redeploy from Vercel dashboard

## Testing the Deployment

1. Visit your Vercel URL (e.g., `https://tala.vercel.app`)
2. Try to login with default credentials:
   - Admin: `admin@nstp.edu` / `admin123`
   - Student: `student@nstp.edu` / `student123`

## Troubleshooting

### API Connection Issues

If you see "Network Error" or "Failed to fetch":

1. **Check VITE_API_URL**: Make sure it's set correctly in Vercel
2. **Check CORS**: Ensure Railway backend has correct `CORS_ORIGIN`
3. **Check Railway Backend**: Make sure it's running (check Railway logs)
4. **Check URL Format**: Should be `https://` not `http://`

### Build Fails

1. **Check Build Logs**: Look for TypeScript or dependency errors
2. **Verify package.json**: Ensure all dependencies are listed
3. **Clear Cache**: In Vercel, go to Deployments → ... → Redeploy (clear cache)

### 404 Errors on Refresh

The `vercel.json` configuration handles this with rewrites. If you still get 404s:

1. Verify `vercel.json` is in the root directory
2. Check that rewrites are configured correctly
3. Redeploy after adding `vercel.json`

## Environment Variables Reference

### Development (.env.local)
```
VITE_API_URL=http://localhost:3000
```

### Production (Vercel Environment Variables)
```
VITE_API_URL=https://your-railway-backend.up.railway.app
```

## Custom Domain Setup

1. Go to Vercel Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Railway `CORS_ORIGIN` to include your custom domain

## Monitoring

- Check Vercel deployment logs for build/runtime errors
- Monitor Railway backend logs for API errors
- Use browser DevTools Network tab to debug API calls
