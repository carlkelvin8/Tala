# Copy & Paste Environment Variables

## ✅ Railway Backend (Already Done)

Your backend is running at: **https://tala-production.up.railway.app/**

Current Railway variables should be:
```
DATABASE_URL = postgresql://neondb_owner:npg_g6k9bYASzWlq@ep-summer-hall-a747xxsd-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_ACCESS_SECRET = (your generated secret)
JWT_REFRESH_SECRET = (your generated secret)
PORT = 3000
NODE_ENV = production
CORS_ORIGIN = * (will update after Vercel deploys)
```

---

## 🌐 Vercel Frontend - ADD THIS NOW

### Step 1: Go to Vercel
1. Dashboard → Your Project → Settings → Environment Variables
2. Click "Add New"

### Step 2: Copy & Paste This Variable

**Name:**
```
VITE_API_URL
```

**Value:**
```
https://tala-production.up.railway.app
```

**Environments:** Select all three:
- ✅ Production
- ✅ Preview  
- ✅ Development

### Step 3: Save and Redeploy
1. Click "Save"
2. Go to "Deployments" tab
3. Click "..." on latest deployment → "Redeploy"

---

## 🔄 After Vercel Deploys - Update Railway CORS

Once Vercel gives you a URL (e.g., `https://tala-xyz123.vercel.app`):

### Go to Railway:
1. Dashboard → Your backend service → Variables
2. Find `CORS_ORIGIN` variable
3. Click to edit

### Replace the value with your Vercel URL:
```
https://YOUR-VERCEL-URL.vercel.app
```

Example:
```
https://tala-abc123.vercel.app
```

**Important:** Use the EXACT Vercel URL (no trailing slash)

---

## 🧪 Quick Test

### Test Backend (works now):
Open browser and visit:
```
https://tala-production.up.railway.app/
```

Should show:
```json
{"success":true,"message":"NSTP API running"}
```

### Test Frontend (after Vercel deploys):
1. Visit your Vercel URL
2. Try login:
   - Email: `admin@nstp.edu`
   - Password: `admin123`

---

## 📝 Summary

**Right now:**
1. ✅ Railway backend is running
2. ⏳ Vercel is building/deploying
3. 🔧 Add `VITE_API_URL` to Vercel (copy from above)
4. 🔄 Redeploy Vercel
5. 🔧 Update Railway `CORS_ORIGIN` with Vercel URL
6. ✅ Done!
