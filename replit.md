# Overview

PresentationFinder is a web application that helps users search for Creative Commons licensed images from Wikimedia Commons for use in presentations. The application provides advanced filtering capabilities based on license types (CC0, CC-BY, CC-BY-SA, etc.), image sizes, and file formats. Users can view detailed image information, download images with proper attribution, and manage favorites and search history.

## Recent Changes

- September 21, 2025: **CRITICAL BUG FIX** - Fixed broken search functionality
  - **Issue**: Search was returning 0 results due to multiple bugs
  - **Fixed**: React Query URL construction (query string format)
  - **Fixed**: Wikimedia Commons API approach (list=search + File namespace)
  - **Fixed**: License filtering normalization (spaces vs hyphens)
  - **Fixed**: Syntax errors causing compilation failures
  - **Result**: Search now works correctly, filtering CC-licensed images for commercial use
  - **Verified**: End-to-end testing confirms full application functionality

- September 21, 2025: Initial project setup and development

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component system for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation through @hookform/resolvers

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Development Server**: Custom Vite integration for hot module replacement in development
- **Error Handling**: Centralized error middleware with proper HTTP status codes

## Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured via Drizzle config)
- **Connection**: Neon Database serverless driver (@neondatabase/serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Storage**: PostgreSQL session store (connect-pg-simple) for user sessions

## Data Models
- **Users**: Authentication and user management (id, username, password)
- **Search History**: Track user search queries with filters and result counts
- **Favorites**: User-saved images with complete metadata and attribution information

## External API Integration
- **Wikimedia Commons API**: Search and retrieve Creative Commons licensed images
- **Image Metadata**: Extract license information, attribution, dimensions, and file sizes
- **License Filtering**: Support for CC0, CC-BY, CC-BY-SA, and CC-BY-NC license types

## Development Tools
- **Build System**: Vite with React plugin for fast development and optimized production builds
- **Type Safety**: Comprehensive TypeScript configuration with strict mode enabled
- **Code Quality**: ESM modules with proper import/export patterns
- **Development Plugins**: Replit-specific plugins for error overlay and development banner

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18 with react-dom, TanStack React Query for data fetching
- **Backend**: Express.js with TypeScript support via tsx
- **Database**: Drizzle ORM with PostgreSQL support and Neon Database serverless driver

## UI and Styling
- **Component Library**: Complete Radix UI primitive set (accordion, dialog, dropdown, etc.)
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Utility Libraries**: clsx and class-variance-authority for conditional styling
- **Icons**: Lucide React for consistent iconography

## Development and Build Tools
- **Build Tooling**: Vite with React plugin, ESBuild for server bundling
- **Type System**: TypeScript with comprehensive type definitions
- **Validation**: Zod schema validation with Drizzle Zod integration
- **Date Handling**: date-fns for date manipulation and formatting

## API and Data Fetching
- **HTTP Client**: Axios for external API requests to Wikimedia Commons
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Command Interface**: cmdk for command palette functionality

## Replit Integration
- **Development Experience**: Replit-specific Vite plugins for error handling and development banners
- **Error Handling**: Runtime error modal overlay for better debugging experience