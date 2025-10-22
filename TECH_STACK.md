# LLM Archive - Tech Stack Guide

## Overview

LLM Archive is a full-stack web application with Chrome extensions for capturing and archiving AI conversation search results from platforms like ChatGPT, Claude.ai, Gemini, and DeepSeek.

---

## Frontend Stack

### Core Framework
- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript** - Static typing for improved developer experience and code quality
- **Vite** - Next-generation frontend build tool with hot module replacement (HMR)

### Routing
- **Wouter** - Lightweight client-side router (~1.5KB)
  - Pattern: `/`, `/search`, `/result/:id`
  - Uses `Link` component and `useLocation` hook

### State Management
- **TanStack Query v5** (React Query)
  - Server state management and caching
  - Automatic background refetching
  - Query invalidation on mutations
  - Pattern: `queryKey: ['/api/search-results', id]` for hierarchical cache segments

### Form Handling
- **React Hook Form** - Performant form state management
- **Zod** - Schema validation and TypeScript type inference
- **@hookform/resolvers/zod** - Integration between React Hook Form and Zod
- Pattern: Form schemas extend Drizzle insert schemas from `shared/schema.ts`

### UI Components & Styling

#### Component Library
- **Shadcn/ui** - High-quality, customizable component collection
- **Radix UI Primitives** - Unstyled, accessible UI components
  - Dialog, Dropdown Menu, Select, Toast, Tabs, etc.
  - All components are ARIA-compliant

#### Styling System
- **Tailwind CSS** - Utility-first CSS framework
- **@tailwindcss/typography** - Beautiful typographic defaults
- **tailwindcss-animate** - Animation utilities
- **class-variance-authority** - Type-safe variant composition
- **clsx** & **tailwind-merge** - Conditional class merging

#### Icons
- **Lucide React** - Clean, consistent icon set
- **React Icons** - Company logos (via `react-icons/si`)

### Additional Frontend Libraries
- **date-fns** - Modern date utility library
- **framer-motion** - Production-ready animation library
- **embla-carousel-react** - Lightweight carousel component
- **recharts** - Composable charting library built on React components
- **react-day-picker** - Flexible date picker component
- **react-resizable-panels** - Resizable split pane layouts
- **cmdk** - Command menu component (⌘K interface)
- **next-themes** - Dark mode support with system preference detection
- **vaul** - Drawer component for mobile-first UIs
- **input-otp** - One-time password input component

---

## Backend Stack

### Runtime & Framework
- **Node.js** - JavaScript runtime
- **Express.js** - Minimalist web framework
  - RESTful API design
  - Middleware-based architecture

### TypeScript Execution
- **TSX** - TypeScript execution engine for development
- **ESBuild** - Fast TypeScript compilation for production builds

### Database Layer

#### Database
- **PostgreSQL** - Production-grade relational database
- **Neon** - Serverless PostgreSQL with `@neondatabase/serverless` driver
  - Environment variable: `DATABASE_URL`

#### ORM & Schema
- **Drizzle ORM** - Lightweight TypeScript ORM
  - Type-safe database queries
  - Schema-first approach in `shared/schema.ts`
- **Drizzle Kit** - Database migration toolkit
  - Command: `npm run db:push` for schema migrations
  - Force push: `npm run db:push --force`
- **drizzle-zod** - Generate Zod schemas from Drizzle tables
  - `createInsertSchema()` for form validation

#### Database Schema
```typescript
// Core entities
- users (id, email, name, avatar_url, created_at)
- search_results (id, query, public_link, platform, description, user_id, views, saves)
- search_queries (query_text, search_count, last_searched)
```

### Session Management
- **express-session** - Session middleware for Express
- **connect-pg-simple** - PostgreSQL session store
- **memorystore** - In-memory session store for development
- **cookie-parser** - Parse cookie headers

### Security & Middleware
- **Helmet** - Security headers middleware
  - Sets Content-Security-Policy, X-Frame-Options, etc.
- **express-rate-limit** - Rate limiting middleware
  - Prevents abuse and DDoS attacks

### Authentication
- **Passport.js** - Authentication middleware
- **passport-local** - Username/password authentication strategy
- **jsonwebtoken** - JWT token generation and verification
  - Used for extension authentication

### File Operations
- **archiver** - Create zip archives (for extension downloads)
- **extract-zip** - Extract zip files

### WebSockets
- **ws** - WebSocket server implementation
  - Real-time updates for live features

---

## Chrome Extension Stack

### Extension Architecture
- **Manifest V3** - Latest Chrome extension manifest version
  - Service workers instead of background pages
  - Improved security and performance

### Extension Components

#### Content Scripts
- **content.js** - Injected into ChatGPT, Claude.ai, Gemini, DeepSeek pages
  - Platform-specific DOM selectors
  - Automated share link capture
  - Message passing with popup/background

#### Popup Interface
- **popup.html/js** - Extension popup UI
  - Form for submitting search results
  - Auto-detection of current platform
  - Real-time stats display

#### Background Service Worker
- **background.js** - Extension background processes
  - Message routing
  - Tab management for clipboard access

### Extension Features

#### Platform Detection
Supports automatic detection and extraction from:
- **ChatGPT** (chatgpt.com)
- **Claude.ai** (claude.ai)
- **Gemini** (gemini.google.com)
- **DeepSeek** (chat.deepseek.com)

#### Auto-Capture Automation
1. **Claude.ai**
   - Clicks Share menu trigger
   - Selects "Publish and copy link"
   - Reads from clipboard

2. **ChatGPT**
   - Clicks Share button
   - Waits for dialog to load
   - Clicks "Create link" or "Update link"
   - Waits for "Copy link" button to appear
   - Clicks "Copy link"
   - Reads from clipboard

#### Permissions
```json
{
  "permissions": ["tabs", "storage", "scripting", "clipboardRead"],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://chat.deepseek.com/*"
  ]
}
```

### Extension Variants
- **chrome-extension-auth/** - Authenticated version with Google OAuth
- **chrome-extension-anonymous/** - Anonymous submission version

---

## Build & Development Tools

### Package Management
- **npm** - Node package manager
- **package.json** scripts:
  - `npm run dev` - Start development server
  - `npm run build` - Build for production
  - `npm run db:push` - Push schema changes to database

### Development Plugins
- **@vitejs/plugin-react** - React support for Vite
- **@replit/vite-plugin-cartographer** - Replit integration
- **@replit/vite-plugin-dev-banner** - Development mode indicator
- **@replit/vite-plugin-runtime-error-modal** - Error overlay

### Type Definitions
- **@types/node** - Node.js type definitions
- **@types/react** - React type definitions
- **@types/react-dom** - ReactDOM type definitions
- **@types/express** - Express type definitions
- **@types/passport** - Passport type definitions
- **@types/jsonwebtoken** - JWT type definitions
- **@types/archiver** - Archiver type definitions
- **@types/ws** - WebSocket type definitions

### Code Quality
- **TypeScript** - Static type checking
- **Zod** - Runtime validation
- **zod-validation-error** - Human-readable validation errors

---

## Architecture Patterns

### Frontend Patterns
```typescript
// API calls via TanStack Query
const { data, isLoading } = useQuery({
  queryKey: ['/api/search-results'],
  // queryFn is auto-configured
});

// Mutations with cache invalidation
const mutation = useMutation({
  mutationFn: (data) => apiRequest('/search-results', 'POST', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
  }
});
```

### Backend Patterns
```typescript
// Storage interface abstraction (server/storage.ts)
interface IStorage {
  createSearchResult(data: InsertSearchResult): Promise<SearchResult>;
  getSearchResults(): Promise<SearchResult[]>;
  // ...
}

// Thin route handlers (server/routes.ts)
router.post('/search-results', async (req, res) => {
  const validated = insertSearchResultSchema.parse(req.body);
  const result = await storage.createSearchResult(validated);
  res.json(result);
});
```

### Type Sharing
```typescript
// shared/schema.ts - Single source of truth
export const searchResults = pgTable('search_results', {
  id: serial('id').primaryKey(),
  query: text('query').notNull(),
  // ...
});

export const insertSearchResultSchema = createInsertSchema(searchResults)
  .omit({ id: true, createdAt: true });

export type SearchResult = typeof searchResults.$inferSelect;
export type InsertSearchResult = z.infer<typeof insertSearchResultSchema>;
```

---

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Server
NODE_ENV=development
PORT=5000

# Extension Auth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SESSION_SECRET=
```

### Vite Environment Variables
Frontend env vars must be prefixed with `VITE_`:
```bash
VITE_API_URL=http://localhost:5000
```
Access via: `import.meta.env.VITE_API_URL`

---

## Deployment Stack

### Hosting Platform
- **Replit** - All-in-one development and deployment
  - Automatic HTTPS
  - Environment variable management
  - Database provisioning
  - Rollback/checkpoint system

### Build Process
```bash
# Frontend: Vite builds to dist/
npm run build

# Backend: TSX compiles TypeScript
# Runs Express server on port 5000
```

### Production URL
- Main app: `https://{repl-name}.replit.app`
- Custom domains supported

---

## Data Flow

### Search Result Submission Flow
```
User fills form → React Hook Form validation → Zod schema check 
→ TanStack Query mutation → Express API endpoint → Drizzle ORM 
→ PostgreSQL insert → Cache invalidation → UI update
```

### Extension Auto-Capture Flow
```
User checks "Post and Share" → Popup sends message → Content script 
→ Wait for dialog → Click "Create link" → Wait for "Copy link" 
→ Click copy → Read clipboard → Send link back to popup 
→ Populate form field
```

### Authentication Flow (Auth Extension)
```
User clicks "Sign in with Google" → OAuth popup window 
→ Server callback → JWT token generation → Store in chrome.storage.local 
→ Attach to API requests via Authorization header
```

---

## Performance Optimizations

### Frontend
- **Code splitting** - Vite automatic chunking
- **Lazy loading** - React.lazy for route components
- **Query caching** - TanStack Query background refetch
- **Debouncing** - Search input debouncing
- **Image optimization** - Lazy loading images

### Backend
- **Connection pooling** - Neon serverless driver
- **Query optimization** - Drizzle prepared statements
- **Rate limiting** - Per-IP request throttling
- **Session storage** - PostgreSQL-backed sessions

### Extension
- **Minimal background** - Service workers only when needed
- **Efficient selectors** - CSS over XPath
- **Retry logic** - Graceful failure handling

---

## Testing & Debugging

### Development Tools
- **Browser DevTools** - React DevTools, Network tab
- **Vite HMR** - Instant feedback on code changes
- **Extension debugging** - `chrome://extensions` Developer Mode
- **Console logging** - Extensive `[Platform] Step X:` logs in content scripts

### Debug Pages
- **/extension-debug.html** - Simulates extension environment
  - Test auto-capture for Claude and ChatGPT
  - Mock URL switching
  - Console log viewer

### Error Handling
- **Zod validation** - User-friendly error messages
- **Try-catch blocks** - Graceful error recovery
- **Toast notifications** - User feedback on errors
- **Fallback methods** - Multiple strategies for link capture

---

## Security Measures

### Backend Security
- **Helmet** - Security headers
- **Rate limiting** - Prevent abuse
- **Input validation** - Zod schemas on all endpoints
- **SQL injection prevention** - Drizzle ORM parameterized queries
- **Session security** - HTTP-only cookies, secure flags
- **CSRF protection** - (if needed, add CSRF tokens)

### Extension Security
- **Content Security Policy** - Restrict script execution
- **Host permissions** - Limited to specific domains
- **Message validation** - Verify message sources
- **No eval()** - Manifest V3 compliance

### Data Privacy
- **User authentication** - Secure JWT tokens
- **Environment secrets** - Never committed to git
- **HTTPS only** - All production traffic encrypted

---

## Future Scalability Considerations

### Potential Additions
- **Redis** - For caching and rate limiting
- **CDN** - For static asset delivery
- **Load balancer** - For horizontal scaling
- **Queue system** - For background jobs (Bull/BullMQ)
- **Monitoring** - Sentry for error tracking, Analytics
- **Testing** - Jest/Vitest for unit tests, Playwright for E2E

### Database Scaling
- **Indexes** - On frequently queried columns
- **Partitioning** - For large tables
- **Read replicas** - For read-heavy workloads
- **Connection pooling** - PgBouncer for large scale

---

## Key Design Decisions

### Why These Technologies?

1. **Drizzle ORM over Prisma**
   - Lighter weight, faster
   - SQL-like syntax, easier migration from raw SQL
   - Better TypeScript inference

2. **Wouter over React Router**
   - Minimal bundle size (~1.5KB vs ~10KB)
   - Sufficient for simple routing needs

3. **TanStack Query over Redux**
   - Server state management built-in
   - Automatic caching and refetching
   - Less boilerplate

4. **Tailwind CSS over CSS-in-JS**
   - Better performance (no runtime)
   - Faster development with utility classes
   - Consistent design system

5. **Manifest V3 for Extensions**
   - Future-proof (V2 being deprecated)
   - Better security model
   - Improved performance

6. **PostgreSQL over MongoDB**
   - Relational data fits better
   - ACID compliance
   - Mature ecosystem

---

## Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run db:push                # Push schema changes
npm run db:push --force        # Force schema update

# Extension Testing
1. Load unpacked from chrome-extension-auth/
2. Test on ChatGPT/Claude conversations
3. Check Console for detailed logs

# Debugging
Open /extension-debug.html     # Test extension simulation
chrome://extensions            # Manage extensions
F12 → Console                  # View content script logs
```

---

## Version Information

- **Node.js**: 18+ recommended
- **PostgreSQL**: 14+
- **Chrome**: 88+ (Manifest V3 support)
- **TypeScript**: 5.x
- **React**: 18.x
- **Vite**: 5.x

---

This tech stack is optimized for:
✅ Developer experience (TypeScript, HMR, type-safe forms)
✅ Performance (Vite, TanStack Query, efficient queries)
✅ Maintainability (Shared types, single schema source)
✅ Scalability (Serverless DB, modular architecture)
✅ Security (Validation, rate limiting, secure sessions)
