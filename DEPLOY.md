# 🚀 ConnectWorld Deployment Guide

## Architecture

```
Users → Vercel (Frontend) ──api/socket──→ Render (Backend) ──db──→ Aiven (MySQL)
         ├── React SPA           │          ├── Express + Socket.IO    ├── MySQL 8
         ├── Vite build          │          ├── Prisma ORM             └── Free tier
         └── Free tier           │          └── Free tier (cold start)
                                 │
                          Vercel Edge CDN
```

## Prerequisites

| Account | Sign Up Link | Free Tier |
|---------|-------------|-----------|
| **Vercel** | https://vercel.com/signup | ✅ Hobby (free) |
| **Render** | https://render.com/register | ✅ Free (spins down after 15 min idle) |
| **Aiven** | https://console.aiven.io/signup | ✅ Always-free MySQL (1GB storage) |

---

## Step 1: Database — Aiven Free MySQL

### 1.1 Create Database
1. Go to **Aiven Console** → **Create service**
2. Select **MySQL** → Choose **Free** plan
3. Select **Google Cloud** → your nearest region (e.g., `us-east1`)
4. Click **Create service** (takes ~2 minutes to provision)

### 1.2 Get Connection String
1. In your Aiven service dashboard, click **Overview**
2. Find the **Connection Information** section
3. Copy the **URI** — it looks like:
   ```
   mysql://avnadmin:XXXXXXXXX@mysql-XXXXX.aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED
   ```
4. **Important:** Change `/defaultdb` to `/connectworld`:
   ```
   mysql://avnadmin:XXXXXXXXX@mysql-XXXXX.aivencloud.com:12345/connectworld?ssl-mode=REQUIRED
   ```
5. Save this — you'll use it as `DATABASE_URL` in the next step

---

## Step 2: Backend — Render

### 2.1 Deploy
1. Go to **Render Dashboard** → **New +** → **Web Service**
2. Connect your GitHub repo (`CodeAlpha_ConnectWorld`)
3. Fill in:

| Field | Value |
|-------|-------|
| **Name** | `connectworld-server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | **Free** |

4. Click **Advanced** → **Add Environment Variable** and add ALL of these:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=<paste your Aiven MySQL URI from Step 1>
JWT_ACCESS_SECRET=<generate a random 32+ char string>
JWT_REFRESH_SECRET=<generate a different random 32+ char string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=https://codealpha-connectworld.vercel.app
CORS_ORIGINS=https://codealpha-connectworld.vercel.app
DOMAIN=connectworld
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

> **Generate JWT secrets:** Run this in terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

5. Click **Create Web Service**

### 2.2 Push Schema & Seed Data

After deployment completes (takes ~3-5 min):

1. Go to your Render dashboard → click your web service
2. Click **Shell** tab (or use: `https://dashboard.render.com/web/srv-xxxxx/shell`)
3. Run these commands:

```bash
# Push Prisma schema to database
npx prisma db push --accept-data-loss

# Seed users (creates 7 demo accounts with passwords)
node dist/seed-users.js
```

### 2.3 Note Your Backend URL
After deployment, your Render URL will be:
```
https://connectworld-server.onrender.com
```
Save this — you'll use it in Step 3.

---

## Step 3: Frontend — Vercel

### 3.1 Deploy
1. Go to **Vercel Dashboard** → **Add New** → **Project**
2. Import your GitHub repo (`CodeAlpha_ConnectWorld`)
3. Set the **Root Directory** to `client`
4. Vercel auto-detects Vite — verify these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

5. Click **Environment Variables** and add:

```env
VITE_API_URL=https://connectworld-server.onrender.com/api
VITE_SOCKET_URL=https://connectworld-server.onrender.com
```

6. Click **Deploy**

### 3.2 Custom Domain (Optional)
1. In Vercel dashboard → your project → **Settings** → **Domains**
2. Add your domain (e.g., `connectworld.app`)
3. Update Vercel env vars → set `VITE_API_URL=https://yourdomain.com/api`
4. Update Render env var `CLIENT_URL` to your custom domain
5. Re-deploy both (Vercel auto-deploys on push)

---

## Step 4: Verify Demo

### Check Backend
```bash
# Health check
curl https://connectworld-server.onrender.com/api/health

# Should return:
# { "success": true, "message": "ConnectWorld API is running", ... }

# Credentials endpoint
curl https://connectworld-server.onrender.com/api/auth/credentials

# Should return 7 demo users with passwords
```

### Check Frontend
Visit your Vercel URL: `https://codealpha-connectworld.vercel.app`
- ✅ Login page loads
- ✅ Click "Show test accounts" → credentials appear
- ✅ Click any account → auto-fills email + password
- ✅ Sign in → Dashboard loads
- ✅ Settings → Appearance → Dark/Light/System works

### Demo Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@connectworld.com | Admin123! | 🔴 Admin |
| manager@connectworld.com | Manager123! | 🟠 Manager |
| moderator@connectworld.com | Mod12345! | 🟡 Moderator |
| user1@connectworld.com | User12345! | 🟢 User |
| user2@connectworld.com | User12345! | 🟢 User |
| user3@connectworld.com | User12345! | 🟢 User |
| guest@connectworld.com | Guest123! | ⚪ Guest |

---

## 🔄 Updating After Changes

### Backend (Render)
Render auto-deploys on every push to the `main` branch.
To manually trigger: Dashboard → Manual Deploy → Deploy latest commit.

### Frontend (Vercel)
Vercel auto-deploys on every push to the `main` branch.
Preview URLs are generated for every PR.

---

## ⚠️ Free Tier Limitations

| Platform | Limitation |
|----------|-----------|
| **Render Free** | Spins down after **15 min idle**. First request takes ~30s to wake. |
| **Aiven Free** | 1GB storage, 1 CPU, 1GB RAM. No automated backups. |
| **Vercel Hobby** | 100GB bandwidth, 6000 build minutes/month. No team features. |

### Mitigate Render Cold Start
Add a **UptimeRobot** (free) monitor pinging `https://connectworld-server.onrender.com/api/health` every 5 minutes to keep it warm.

---

## 🔧 Troubleshooting

### "CORS Error" in Browser
- Verify `CLIENT_URL` on Render matches exactly your Vercel domain
- Check `VITE_API_URL` on Vercel points to Render URL with `/api` suffix

### "Database connection failed"
- Verify Aiven service is running (Aiven Console)
- Check `DATABASE_URL` includes `?ssl-mode=REQUIRED` for Aiven
- Ensure `/defaultdb` is changed to `/connectworld`

### "Prisma schema not found"
- Run `npx prisma generate` via Render Shell
- Re-deploy after generating

### "Socket.IO not connecting"
- Check `VITE_SOCKET_URL` on Vercel points to the Render base URL (no `/api` suffix)
- Socket.IO uses WebSocket transport with polling fallback
