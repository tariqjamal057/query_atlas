# LLM Archive - Deployment Guide

This guide covers deploying the LLM Archive application to Render and Vercel with a PostgreSQL database.

---

## Deployment Architecture Options

### Option 1: Full-Stack on Render (Recommended)
- **Backend + Frontend**: Deploy entire app on Render
- **Database**: Render PostgreSQL or external (Neon, Supabase)
- **Best for**: Simplicity, single deployment, WebSocket support

### Option 2: Split Deployment
- **Backend**: Render Web Service
- **Frontend**: Vercel
- **Database**: Neon/Supabase PostgreSQL
- **Best for**: Edge deployment, global CDN for frontend

---

## Prerequisites

Before deploying, ensure you have:
- [ ] GitHub repository with your code
- [ ] Render account (render.com)
- [ ] Vercel account (vercel.com) - if using split deployment
- [ ] PostgreSQL database credentials

---

# Option 1: Full-Stack Deployment on Render

## Step 1: Prepare Your Repository

### 1.1 Create Required Files

Create `render.yaml` in your project root:

```yaml
services:
  # Web Service (Full-Stack App)
  - type: web
    name: llm-archive
    env: node
    region: oregon
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: llm-archive-db
          property: connectionString
      - key: SESSION_SECRET
        generateValue: true
      - key: PORT
        value: 5000
    healthCheckPath: /

databases:
  # PostgreSQL Database
  - name: llm-archive-db
    plan: starter
    databaseName: llm_archive
    user: llm_archive_user
```

### 1.2 Update package.json Scripts

Add production scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build",
    "start": "NODE_ENV=production node --loader tsx server/index.ts",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

### 1.3 Configure Vite for Production

Ensure `vite.config.ts` has proper build settings:

```typescript
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  // ... rest of config
});
```

## Step 2: Deploy to Render

### 2.1 Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

**Settings:**
- **Name**: `llm-archive`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `.` (leave empty)
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Plan**: Starter ($7/month) or Free

### 2.2 Add Environment Variables

In the Render dashboard, add these environment variables:

```
NODE_ENV=production
PORT=5000
SESSION_SECRET=<generate-random-32-char-string>
```

### 2.3 Create PostgreSQL Database

**Option A: Render PostgreSQL**

1. Click **"New +"** → **"PostgreSQL"**
2. **Name**: `llm-archive-db`
3. **Database**: `llm_archive`
4. **User**: `llm_archive_user`
5. **Region**: Same as web service
6. **Plan**: Starter ($7/month) or Free

After creation:
1. Go to web service settings
2. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Copy from PostgreSQL database "Internal Database URL"

**Option B: External Database (Neon)**

1. Sign up at [neon.tech](https://neon.tech)
2. Create new project: `llm-archive`
3. Copy connection string
4. Add to Render environment variables:
   ```
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   ```

### 2.4 Push Database Schema

After deployment, run migrations:

1. Go to Render web service
2. Click **"Shell"** tab
3. Run: `npm run db:push`

Or use Render's Build Hook with a migration script.

### 2.5 Deploy

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Watch build logs for errors
3. Once deployed, your app will be available at: `https://llm-archive.onrender.com`

## Step 3: Configure Custom Domain (Optional)

1. In Render dashboard, go to your web service
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain: `llmarchive.com`
4. Update DNS records at your domain provider:
   ```
   Type: CNAME
   Name: @
   Value: llm-archive.onrender.com
   ```
5. Wait for DNS propagation (5-60 minutes)

---

# Option 2: Split Deployment (Vercel + Render)

## Part A: Backend on Render

### Step 1: Prepare Backend for Render

Create `render.yaml` for backend only:

```yaml
services:
  - type: web
    name: llm-archive-api
    env: node
    region: oregon
    plan: starter
    buildCommand: npm install
    startCommand: NODE_ENV=production node --loader tsx server/index.ts
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: llm-archive-db
          property: connectionString
      - key: SESSION_SECRET
        generateValue: true
      - key: PORT
        value: 5000
      - key: CORS_ORIGIN
        value: https://your-frontend.vercel.app
    healthCheckPath: /api/stats

databases:
  - name: llm-archive-db
    plan: starter
```

### Step 2: Update Backend for CORS

Update `server/index.ts` to allow Vercel origin:

```typescript
import cors from 'cors';

const app = express();

// CORS configuration for Vercel frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

Install cors: `npm install cors @types/cors`

### Step 3: Deploy Backend to Render

Follow "Option 1: Step 2" but only deploy the backend.

Backend will be available at: `https://llm-archive-api.onrender.com`

## Part B: Frontend on Vercel

### Step 1: Prepare Frontend for Vercel

Create `vercel.json` in project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://llm-archive-api.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 2: Update API Base URL

Update `client/src/lib/queryClient.ts` to use environment variable:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = `${API_BASE}${queryKey[0]}`;
        // ... rest of code
      }
    }
  }
});
```

### Step 3: Deploy to Vercel

#### Option A: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure project:

**Build Settings:**
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Environment Variables:**
```
VITE_API_URL=https://llm-archive-api.onrender.com
```

5. Click **"Deploy"**

### Step 4: Configure Custom Domain on Vercel

1. Go to project settings
2. Click **"Domains"**
3. Add your domain: `llmarchive.com`
4. Follow Vercel's DNS instructions

---

# Database Setup & Migrations

## Using Neon PostgreSQL (Recommended for Production)

### Step 1: Create Neon Project

1. Sign up at [neon.tech](https://neon.tech)
2. Create project: **LLM Archive**
3. Region: Choose closest to Render/Vercel region
4. Copy connection string

### Step 2: Add to Environment Variables

**Render:**
```
DATABASE_URL=postgresql://user:pass@ep-xxx.region.neon.tech/llmarchive?sslmode=require
```

**Vercel (if using Vercel Functions):**
```
DATABASE_URL=postgresql://user:pass@ep-xxx.region.neon.tech/llmarchive?sslmode=require
```

### Step 3: Push Schema

```bash
# Local
DATABASE_URL="your-neon-url" npm run db:push

# Or via Render Shell
npm run db:push
```

## Using Render PostgreSQL

Already covered in Option 1. Render's PostgreSQL includes:
- Automatic backups
- Connection pooling
- Metrics & monitoring
- Point-in-time recovery (paid plans)

---

# Environment Variables Reference

## Production Environment Variables

### Required for All Deployments
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
SESSION_SECRET=<random-32-character-string>
PORT=5000
```

### For Split Deployment (Backend)
```bash
CORS_ORIGIN=https://your-frontend.vercel.app
```

### For Split Deployment (Frontend)
```bash
VITE_API_URL=https://your-backend.onrender.com
```

### Optional (OAuth)
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Generate SESSION_SECRET

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

---

# Post-Deployment Checklist

## Backend Health Checks

Test these endpoints:

```bash
# Health check
curl https://your-app.onrender.com/

# API endpoint
curl https://your-app.onrender.com/api/stats

# Search results
curl https://your-app.onrender.com/api/search-results
```

## Frontend Checks

- [ ] Homepage loads correctly
- [ ] Search functionality works
- [ ] Forms submit successfully
- [ ] API calls reach backend
- [ ] Dark mode toggles
- [ ] Mobile responsive

## Database Checks

```bash
# Connect to database
psql $DATABASE_URL

# Verify tables
\dt

# Check data
SELECT COUNT(*) FROM search_results;
```

---

# Continuous Deployment

## Render Auto-Deploy

Render automatically deploys on git push to main branch.

To disable:
1. Go to web service settings
2. **Auto-Deploy**: Off

## Vercel Auto-Deploy

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests

Configuration in project settings → Git.

---

# Performance Optimization

## Render Optimizations

### 1. Use Persistent Disk (Paid Plans)
```yaml
services:
  - type: web
    disk:
      name: data
      mountPath: /data
      sizeGB: 1
```

### 2. Scale Instances
- Go to Settings → Scaling
- Add more instances for high traffic

### 3. Enable HTTP/2
Automatic on Render for all custom domains.

## Vercel Optimizations

### 1. Edge Functions (Premium)
Deploy API routes to edge locations globally.

### 2. Image Optimization
Use Vercel's built-in image optimizer:
```jsx
import Image from 'next/image'; // If using Next.js
```

### 3. Caching Headers
Already handled by Vite build output.

---

# Monitoring & Logging

## Render Monitoring

### Built-in Metrics
- CPU usage
- Memory usage
- Request count
- Response time

Access: Dashboard → Metrics tab

### Logs
```bash
# View live logs
render logs -f llm-archive

# Or in dashboard: Logs tab
```

## Vercel Monitoring

### Analytics (Premium)
- Real user monitoring
- Core Web Vitals
- Performance insights

### Logs
- Go to Deployments → View logs
- Real-time function logs

## External Monitoring (Recommended)

### Sentry for Error Tracking
```bash
npm install @sentry/react @sentry/node
```

Add to `client/src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
});
```

### Uptime Monitoring
- [UptimeRobot](https://uptimerobot.com) - Free tier available
- [Better Uptime](https://betteruptime.com)
- Ping your `/api/stats` endpoint every 5 minutes

---

# Backup & Recovery

## Database Backups

### Render PostgreSQL
- **Free tier**: Daily backups (7-day retention)
- **Paid tiers**: Hourly backups, point-in-time recovery

Manual backup:
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Neon PostgreSQL
- Automatic branching for dev/staging
- Point-in-time recovery
- Manual backups:
```bash
pg_dump "postgresql://..." > backup.sql
```

## Restore from Backup

```bash
# Drop and recreate database (DANGEROUS!)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore
psql $DATABASE_URL < backup.sql
```

---

# Troubleshooting

## Common Issues

### Build Fails on Render

**Error**: `MODULE_NOT_FOUND`
```bash
# Fix: Ensure all dependencies are in package.json
npm install --save <missing-package>
```

**Error**: TypeScript compilation fails
```bash
# Fix: Check tsconfig.json and install @types packages
npm install --save-dev @types/node @types/express
```

### CORS Errors (Split Deployment)

**Error**: `Access-Control-Allow-Origin`

Fix in `server/index.ts`:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
```

Update `CORS_ORIGIN` environment variable on Render.

### Database Connection Fails

**Error**: `ECONNREFUSED` or `ETIMEDOUT`

1. Check `DATABASE_URL` format:
   ```
   postgresql://user:pass@host:5432/db?sslmode=require
   ```
2. Ensure SSL mode is set: `?sslmode=require`
3. Verify database is in same region as web service

### Vercel Deployment Fails

**Error**: Build command not found

Fix `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install"
}
```

### Environment Variables Not Working

**Frontend (Vite)**:
- Must prefix with `VITE_`
- Must rebuild after changing
- Access via `import.meta.env.VITE_VAR_NAME`

**Backend**:
- Access via `process.env.VAR_NAME`
- Restart service after changing

---

# Cost Breakdown

## Render Pricing

### Free Tier
- **Web Service**: Free (spins down after inactivity)
- **PostgreSQL**: Free (expires after 90 days)
- **Total**: $0/month

### Starter Tier
- **Web Service**: $7/month (always on)
- **PostgreSQL**: $7/month (1GB storage)
- **Total**: $14/month

## Vercel Pricing

### Hobby (Free)
- 100GB bandwidth/month
- Unlimited deployments
- **Total**: $0/month

### Pro
- $20/month per user
- 1TB bandwidth
- Advanced analytics

## Neon PostgreSQL

### Free Tier
- 0.5GB storage
- 1 project
- **Total**: $0/month

### Pro
- Starting at $19/month
- 10GB storage
- Branching, point-in-time recovery

## Recommended Starter Setup

**For Production:**
- Render Web Service (Starter): $7/month
- Neon PostgreSQL (Free): $0/month
- **Total**: $7/month

**For High Traffic:**
- Render Web Service (Standard): $25/month
- Neon PostgreSQL (Pro): $19/month
- **Total**: $44/month

---

# Security Checklist

- [ ] HTTPS enabled (automatic on Render/Vercel)
- [ ] Environment variables configured (no secrets in code)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Database SSL connection enforced
- [ ] Helmet security headers active
- [ ] Session secret is strong (32+ characters)
- [ ] Input validation with Zod on all endpoints
- [ ] SQL injection prevention (Drizzle ORM)
- [ ] XSS prevention (React auto-escaping)

---

# Maintenance

## Regular Tasks

### Weekly
- Monitor error logs
- Check uptime metrics
- Review database size

### Monthly
- Update dependencies: `npm outdated && npm update`
- Review and rotate secrets if needed
- Check backup integrity

### Quarterly
- Database optimization: `VACUUM ANALYZE;`
- Review and optimize slow queries
- Audit security headers

---

# Rollback Procedure

## Render Rollback

1. Go to Deployments tab
2. Find previous successful deployment
3. Click **"Rollback to this version"**

## Vercel Rollback

1. Go to Deployments
2. Find previous deployment
3. Click **"..."** → **"Promote to Production"**

## Database Rollback

```bash
# Restore from backup
psql $DATABASE_URL < backup-timestamp.sql
```

---

# Support Resources

## Render Documentation
- [Render Docs](https://render.com/docs)
- [Deploy Node.js](https://render.com/docs/deploy-node-express-app)
- [PostgreSQL Guide](https://render.com/docs/databases)

## Vercel Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Vite Deployment](https://vercel.com/guides/deploying-vite-to-vercel)
- [Environment Variables](https://vercel.com/docs/environment-variables)

## Community
- Render Discord
- Vercel Discord
- Stack Overflow

---

## Quick Deploy Commands

```bash
# Deploy to Render (via CLI)
render deploy

# Deploy to Vercel
vercel --prod

# Run migrations
npm run db:push

# Check deployment health
curl https://your-app.onrender.com/api/stats
```

---

**Your LLM Archive app is now deployed! 🚀**

Monitor your deployments and enjoy your live application.
