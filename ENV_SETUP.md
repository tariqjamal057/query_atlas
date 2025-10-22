# Environment Variables Setup Guide

## Quick Start

### 1. Copy the Example File

```bash
cp .env.example .env
```

### 2. Required Variables

Open `.env` and configure these **required** variables:

```bash
# Database connection (Replit provides this automatically)
DATABASE_URL=postgresql://user:password@host:port/database

# Session secret (generate with command below)
SESSION_SECRET=your-generated-secret-here

# Environment
NODE_ENV=development
PORT=5000
```

### 3. Generate Secure Secrets

#### SESSION_SECRET

Run one of these commands to generate a secure random secret:

```bash
# Using Node.js (recommended)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and paste it as your `SESSION_SECRET` value.

## Environment-Specific Configuration

### Development (Local)

```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://localhost:5432/llm_archive
SESSION_SECRET=<your-generated-secret>
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=/api
DEBUG=true
```

### Production (Render/Vercel)

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
SESSION_SECRET=<strong-random-secret>
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Replit Deployment

Replit automatically provides:
- `DATABASE_URL` (if PostgreSQL is enabled)
- `REPL_ID`
- `REPLIT_DB_URL`

You only need to add:
```bash
SESSION_SECRET=<your-generated-secret>
```

## Optional Configuration

### OAuth Authentication

If you want Google OAuth login:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add to `.env`:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
OAUTH_CALLBACK_URL=http://localhost:5000/auth/google/callback
```

### Rate Limiting

```bash
RATE_LIMIT_WINDOW=900000    # 15 minutes in milliseconds
RATE_LIMIT_MAX=100           # Max requests per window
```

### Logging

```bash
LOG_LEVEL=debug              # error | warn | info | debug
LOG_REQUESTS=true            # Log all HTTP requests
```

### Error Tracking (Sentry)

```bash
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

## Verifying Your Setup

### 1. Check Environment Variables Load

Create a test file `test-env.js`:

```javascript
require('dotenv').config();

console.log('Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✓ Set' : '✗ Not set');
```

Run it:
```bash
node test-env.js
```

### 2. Test Database Connection

```bash
npm run db:push
```

Should output: "✓ Schema pushed successfully"

### 3. Start Development Server

```bash
npm run dev
```

Should start without errors and show:
```
Server running on http://localhost:5000
```

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] `SESSION_SECRET` is at least 32 characters
- [ ] `SESSION_SECRET` is different for dev/staging/production
- [ ] Database connection uses SSL in production (`?sslmode=require`)
- [ ] No secrets are hardcoded in source files
- [ ] `.env.example` has no real secrets (only placeholders)

## Troubleshooting

### "Cannot find module 'dotenv'"

The project uses environment variables natively in Replit. If running locally:

```bash
npm install dotenv
```

Then add to the top of `server/index.ts`:
```typescript
import dotenv from 'dotenv';
dotenv.config();
```

### "DATABASE_URL is not defined"

**On Replit:**
1. Go to Tools → Database
2. Create a PostgreSQL database
3. `DATABASE_URL` will be automatically available

**Locally:**
1. Install PostgreSQL
2. Create database: `createdb llm_archive`
3. Add to `.env`: `DATABASE_URL=postgresql://localhost:5432/llm_archive`

### "Session secret is required"

Generate a secret and add to `.env`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### CORS errors in browser

Update `.env`:
```bash
CORS_ORIGIN=http://localhost:5173
```

Restart the server.

## Platform-Specific Notes

### Replit

- Environment variables managed in Secrets tab
- `DATABASE_URL` auto-provided when PostgreSQL is enabled
- No need for `.env` file, use Secrets UI

### Render

- Set environment variables in dashboard: Settings → Environment
- Database URL provided automatically if using Render PostgreSQL
- Can use `render.yaml` for infrastructure as code

### Vercel

- Frontend env vars must be prefixed with `VITE_`
- Set in: Settings → Environment Variables
- Redeploy after changing variables

## Quick Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Environment mode |
| `PORT` | Yes | 5000 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | - | Session encryption key |
| `CORS_ORIGIN` | No | * | Allowed CORS origins |
| `VITE_API_URL` | No | /api | API base URL for frontend |
| `LOG_LEVEL` | No | info | Logging verbosity |

## Need Help?

- Check `.env.example` for all available variables
- See `DEPLOYMENT_GUIDE.md` for production setup
- See `TECH_STACK.md` for architecture details
