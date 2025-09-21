# Overview

LLM Archive is a full-stack web application designed to help users save, organize, and discover AI search results from popular LLM platforms like ChatGPT, Claude, Gemini, and DeepSeek. The application consists of a React frontend, Express.js backend, PostgreSQL database, and Chrome extension for automated capture. Users can submit search results with public links, browse existing results, search for similar queries, and track engagement metrics through views and saves.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod schema validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM with PostgreSQL as the database
- **API Design**: RESTful API endpoints for CRUD operations on search results and queries
- **Development Setup**: Hot reloading with Vite middleware integration for seamless development experience

## Data Storage
- **Database**: PostgreSQL with Neon serverless driver for cloud deployment
- **Schema Design**: Three main entities - users, search_results, and search_queries with proper relationships
- **Migration System**: Drizzle Kit for database schema migrations and management

## Chrome Extension Integration
- **Architecture**: Manifest V3 extension with background service worker, content scripts, and popup interface
- **Platform Support**: Automated detection and data extraction from ChatGPT, Claude, Gemini, and DeepSeek
- **Communication**: Extension communicates with the web application via REST API endpoints

## Key Features
- **Search and Discovery**: Full-text search capabilities for finding similar search results
- **Engagement Tracking**: View and save counters for measuring content popularity
- **Platform Integration**: Support for multiple LLM platforms with platform-specific extractors
- **Responsive Design**: Mobile-first design with adaptive layouts using Tailwind CSS

# External Dependencies

## Database Services
- **Neon**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL dialect

## Frontend Libraries
- **React Ecosystem**: React 18 with TypeScript, Vite build tool
- **UI Components**: Radix UI primitives, Shadcn/ui component library
- **Styling**: Tailwind CSS with custom design system variables
- **State Management**: TanStack Query for server state, React Hook Form for form state
- **Validation**: Zod for runtime type validation and schema definition

## Backend Infrastructure
- **Express.js**: Web application framework with middleware support
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Development Tools**: TSX for TypeScript execution, ESBuild for production builds

## Browser Extension APIs
- **Chrome Extensions API**: Manifest V3 with permissions for tab access, storage, and host permissions
- **Content Script Integration**: Platform-specific selectors and data extraction logic