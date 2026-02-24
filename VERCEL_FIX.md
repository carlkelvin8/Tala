# Vercel Configuration Fix

## 🔧 Manual Override in Vercel UI

The vercel.json isn't being picked up. You need to manually configure in Vercel:

### Step-by-Step:

1. **Go to Vercel Dashboard** → Your Project
2. Click **Settings** (left sidebar)
3. Scroll to **"Build & Development Settings"**
4. Click **"Override"** toggle to enable overrides

### Configure These Exact Values:

**Build Command:**
```
cd frontend && npm run build
```

**Output Directory:**
```
frontend/dist
```

**Install Command:**
```
cd frontend && npm install
```

**Development Command:** (optional)
```
cd frontend && npm run dev
```

5. Click **"Save"** at the bottom

---

## 🔄 Then Redeploy

1. Go to **Deployments** tab
2. Click **"Redeploy"**

---

## Alternative: Delete and Re-import

If the above doesn't work:

1. **Delete the current Vercel project**
2. **Import again** from GitHub
3. During import, when you see **"Configure Project"**:
   - Click **"Edit"** next to Root Directory
   - Select or type: `frontend`
   - Framework will auto-detect as Vite
4. Add environment variable `VITE_API_URL` = `https://tala-production.up.railway.app`
5. Deploy

This will properly set the root directory from the start.
