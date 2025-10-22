# Environment Variables - Quick Reference Card

## 🚀 Quick Setup (1 Minute)

```bash
# 1. Copy example file
cp .env.example .env

# 2. Generate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Edit .env and paste the secret
nano .env  # or use your editor

# 4. Start the app
npm run dev
```

## 📋 Minimum Required Variables

```bash
DATABASE_URL=postgresql://localhost:5432/llm_archive
SESSION_SECRET=<paste-generated-secret-here>
NODE_ENV=development
PORT=5000
```

## 🔐 Generate Secrets Quick Commands

```bash
# Session Secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT Secret (32 bytes)
openssl rand -hex 32

# Multiple secrets at once
node scripts/setup-env.js
```

## 🎯 Environment Presets

### Local Development
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://localhost:5432/llm_archive
SESSION_SECRET=<generated-secret>
VITE_API_URL=/api
DEBUG=true
```

### Replit
```bash
# DATABASE_URL is auto-provided
SESSION_SECRET=<generated-secret>
NODE_ENV=development
PORT=5000
```

### Render Production
```bash
NODE_ENV=production
DATABASE_URL=<from-render-postgresql>
SESSION_SECRET=<strong-random-secret>
PORT=5000
```

### Vercel + Render Split
**Backend (Render):**
```bash
NODE_ENV=production
DATABASE_URL=<neon-or-render-db>
SESSION_SECRET=<secret>
CORS_ORIGIN=https://your-app.vercel.app
PORT=5000
```

**Frontend (Vercel):**
```bash
VITE_API_URL=https://your-api.onrender.com/api
```

## 🔍 Troubleshooting One-Liners

```bash
# Test if .env loads
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"

# Verify database connection
npm run db:push

# Check all env vars
printenv | grep -E 'DATABASE_URL|SESSION_SECRET|NODE_ENV'

# Generate new secret quickly
echo "SESSION_SECRET=$(openssl rand -hex 32)"
```

## ⚡ Platform-Specific Commands

### Replit
```bash
# Set secret in Replit (use Secrets UI instead)
# Or use .env file (not recommended for production)
```

### Render
```bash
# Set via CLI
render env set SESSION_SECRET=<your-secret>

# Or use dashboard: Settings → Environment → Add Environment Variable
```

### Vercel
```bash
# Set via CLI
vercel env add SESSION_SECRET production

# List all env vars
vercel env ls
```

## 📊 Variable Priority (from highest to lowest)

1. System environment variables
2. `.env.production` (if NODE_ENV=production)
3. `.env.local` (git ignored, local overrides)
4. `.env` (git ignored, shared defaults)
5. `.env.example` (git tracked, documentation only)

## 🛡️ Security Checklist

```bash
# Check .env is in .gitignore
grep -q "^\.env$" .gitignore && echo "✓ .env is ignored" || echo "✗ Add .env to .gitignore!"

# Verify secret strength (should be 64+ chars)
node -e "const s=process.env.SESSION_SECRET; console.log(s?.length >= 64 ? '✓ Strong' : '✗ Weak')"

# Check for placeholder secrets
grep -i "change-this\|your-secret\|example\|placeholder" .env && echo "⚠️  Found placeholder secrets!"
```

## 📦 All Available Variables

| Variable | Required | Type | Example |
|----------|----------|------|---------|
| `NODE_ENV` | ✅ | string | development |
| `PORT` | ✅ | number | 5000 |
| `DATABASE_URL` | ✅ | string | postgresql://... |
| `SESSION_SECRET` | ✅ | string | 64-char hex |
| `CORS_ORIGIN` | ❌ | string | http://localhost:5173 |
| `VITE_API_URL` | ❌ | string | /api |
| `JWT_SECRET` | ❌ | string | 64-char hex |
| `GOOGLE_CLIENT_ID` | ❌ | string | xxx.apps.googleusercontent.com |
| `GOOGLE_CLIENT_SECRET` | ❌ | string | GOCSPX-xxx |
| `RATE_LIMIT_WINDOW` | ❌ | number | 900000 |
| `RATE_LIMIT_MAX` | ❌ | number | 100 |
| `LOG_LEVEL` | ❌ | string | debug |
| `SENTRY_DSN` | ❌ | string | https://... |

## 🎨 Template Snippets

### Full Local Development
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/llm_archive
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=/api
LOG_LEVEL=debug
DEBUG=true
```

### Production (Render + Neon)
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/llmarchive?sslmode=require
SESSION_SECRET=<64-char-random-hex-generated-with-openssl>
CORS_ORIGIN=https://llmarchive.com
```

### With OAuth
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
SESSION_SECRET=<secret>
GOOGLE_CLIENT_ID=123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
OAUTH_CALLBACK_URL=https://llmarchive.com/auth/google/callback
JWT_SECRET=<secret>
JWT_EXPIRES_IN=30d
```

## 📞 Help

- **Full guide**: See `ENV_SETUP.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Architecture**: See `TECH_STACK.md`
- **Issue**: Check `.env.example` for all options

---

**Remember**: Never commit `.env` to git! Always use strong random secrets in production.
