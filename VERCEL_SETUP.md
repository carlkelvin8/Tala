# Vercel Setup Instructions

## ⚙️ Project Settings Configuration

You need to configure Vercel to use the `frontend` directory as the root.

### In Vercel Dashboard:

1. Go to your project
2. Click **Settings**
3. Go to **General** section

### Configure These Settings:

**Root Directory:**
```
frontend
```
Click "Edit" next to Root Directory and set it to `frontend`

**Framework Preset:**
```
Vite
```

**Build Command:**
```
npm run build
```
(Leave as default)

**Output Directory:**
```
dist
```
(Leave as default)

**Install Command:**
```
npm install
```
(Leave as default)

---

## 🌍 Environment Variables

After configuring the root directory, add this environment variable:

**Go to:** Settings → Environment Variables

**Add:**
- Name: `VITE_API_URL`
- Value: `https://tala-production.up.railway.app`
- Environments: ✅ Production, ✅ Preview, ✅ Development

---

## 🔄 Redeploy

After making these changes:

1. Go to **Deployments** tab
2. Click **"..."** menu on the latest deployment
3. Click **"Redeploy"**

The build should now succeed!

---

## ✅ Expected Result

After successful deployment, you'll get a URL like:
```
https://tala-xyz123.vercel.app
```

Then update Railway `CORS_ORIGIN` with this URL.
