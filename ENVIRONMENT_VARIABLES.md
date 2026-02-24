# Environment Variables - Copy & Paste Guide

## 🚀 Railway Backend Environment Variables

Copy and paste these into Railway Dashboard → Your Service → Variables:

```
DATABASE_URL
postgresql://neondb_owner:npg_g6k9bYASzWlq@ep-summer-hall-a747xxsd-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

```
JWT_ACCESS_SECRET
REPLACE_WITH_YOUR_GENERATED_SECRET_1
```

```
JWT_REFRESH_SECRET
REPLACE_WITH_YOUR_GENERATED_SECRET_2
```

```
PORT
3000
```

```
NODE_ENV
production
```

```
CORS_ORIGIN
REPLACE_WITH_YOUR_VERCEL_URL
```

### Generate JWT Secrets:
Run this command twice in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🌐 Vercel Frontend Environment Variables

Copy and paste these into Vercel Dashboard → Project Settings → Environment Variables:

### Variable 1:
```
Name: VITE_API_URL
Value: REPLACE_WITH_YOUR_RAILWAY_URL
Environment: Production, Preview, Development (select all)
```

---

## 📝 How to Fill In:

### Step 1: Get Your Railway URL
1. Go to Railway Dashboard
2. Click your backend service
3. Go to Settings → Domains
4. Copy the URL (e.g., `https://tala-production.up.railway.app`)

### Step 2: Get Your Vercel URL
1. Go to Vercel Dashboard
2. Click your project
3. Copy the deployment URL (e.g., `https://tala-abc123.vercel.app`)

### Step 3: Generate JWT Secrets
Run this twice:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Complete Configuration Example

### Railway Variables (after filling in):
```
DATABASE_URL = postgresql://neondb_owner:npg_g6k9bYASzWlq@ep-summer-hall-a747xxsd-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_ACCESS_SECRET = a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

JWT_REFRESH_SECRET = z9y8x7w6v5u4321098765432109876543210fedcba0987654321fedcba098765

PORT = 3000

NODE_ENV = production

CORS_ORIGIN = https://tala-abc123.vercel.app
```

### Vercel Variables (after filling in):
```
VITE_API_URL = https://tala-production.up.railway.app
```

---

## 🔄 Deployment Order

1. ✅ Add all Railway variables (backend should already be done)
2. ⏳ Get Railway URL from Settings → Domains
3. ⏳ Wait for Vercel build to complete
4. ⏳ Get Vercel URL from deployment
5. 🔧 Add `VITE_API_URL` to Vercel with Railway URL
6. 🔧 Update `CORS_ORIGIN` in Railway with Vercel URL
7. 🔄 Redeploy both services
8. ✅ Test the application

---

## 🧪 Testing

### Test Backend:
```bash
curl https://YOUR_RAILWAY_URL/
# Should return: {"success":true,"message":"NSTP API running"}
```

### Test Frontend:
1. Visit your Vercel URL
2. Login with: `admin@nstp.edu` / `admin123`
3. Check browser console (F12) for any errors

---

## 📋 Quick Copy Format

### For Railway CORS_ORIGIN:
```
https://YOUR-VERCEL-APP.vercel.app
```

### For Vercel VITE_API_URL:
```
https://YOUR-RAILWAY-APP.up.railway.app
```

**Important**: 
- Use `https://` (not `http://`)
- No trailing slash at the end
- Copy the exact URL from the platform

---

## 🆘 If Something Goes Wrong

### Backend not responding:
- Check Railway Deploy Logs
- Verify all environment variables are set
- Check DATABASE_URL is correct

### Frontend can't connect:
- Check `VITE_API_URL` is set in Vercel
- Verify Railway URL is correct
- Check CORS_ORIGIN in Railway matches Vercel URL

### CORS errors:
- Update Railway `CORS_ORIGIN` to exact Vercel URL
- Redeploy Railway after updating
- Clear browser cache and try again
