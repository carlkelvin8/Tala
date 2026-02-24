# Vercel Setup Instructions - UPDATED

## 🎯 Quick Fix: Configure in Vercel UI

Since you don't see "Root Directory" option, follow these steps:

### Method 1: During Import (If Re-importing)

1. **Delete current Vercel project** (if needed)
2. **Import again** from GitHub
3. During import, you'll see **"Root Directory"** option
4. Click **"Edit"** and select `frontend`
5. Continue with deployment

### Method 2: Use Project Settings (Current Project)

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** (left sidebar)
3. Scroll down to find **"Root Directory"** or **"Build & Development Settings"**
4. Look for an **"Override"** toggle or **"Edit"** button
5. Set Root Directory to: `frontend`

### Method 3: Let vercel.json Handle It (Easiest)

I've updated the `vercel.json` file to handle the monorepo structure automatically.

**Just do this:**

1. Wait for the latest commit to sync (already pushed)
2. Go to Vercel → **Deployments**
3. Click **"Redeploy"** on the latest deployment
4. Vercel will use the new `vercel.json` configuration

---

## 🌍 Add Environment Variable

**Go to:** Settings → Environment Variables → Add New

**Add:**
- Name: `VITE_API_URL`
- Value: `https://tala-production.up.railway.app`
- Environments: ✅ Production, ✅ Preview, ✅ Development

Click **Save**

---

## 🔄 Redeploy

After adding the environment variable:

1. Go to **Deployments** tab
2. Click **"Redeploy"** (it will use the new vercel.json)

---

## ✅ It Should Work Now!

The new `vercel.json` tells Vercel:
- Install from `frontend` directory
- Build from `frontend` directory  
- Output is in `frontend/dist`

No need to manually set root directory!

