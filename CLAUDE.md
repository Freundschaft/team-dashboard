# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack (opens on http://localhost:3000)
- `npm run build` - Build production application with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code linting
- `npx tsc --noEmit` - Type checking without emitting files

## Database Setup Commands

```bash
# Start PostgreSQL with Docker
docker run --name team-dashboard-db -e POSTGRES_DB=team_dashboard -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14

# Run database schema
psql -U postgres -h localhost -d team_dashboard -f database/schema.sql

# Run seed data (optional)
psql -U postgres -h localhost -d team_dashboard -f database/seed.sql
```

## Project Architecture

This is a full-stack team management application built with Next.js 15, PostgreSQL, and TypeScript. It implements hierarchical team structures with member management.

### Key Technologies
- **Next.js 15** with App Router for SSR and API routes
- **PostgreSQL** with raw SQL queries (no ORM, uses `pg` library)
- **TypeScript** with comprehensive type safety
- **Tailwind CSS v4** with custom CSS variables
- **React 19** for UI components

### Database Architecture
- **teams** table with self-referencing parent_id for hierarchy
- **users** table for user information
- **team_members** junction table with roles and status
- Raw SQL queries in `src/lib/queries.ts` for performance

### API Structure
```
/api/teams - GET (hierarchy), POST (create)
/api/teams/[id] - GET, PUT, DELETE
/api/teams/[id]/members - GET, POST
/api/members/[id] - PUT, DELETE  
/api/users - GET
```

### Component Architecture
- `TeamsHierarchy` - Main dashboard component
- `TeamCard` - Recursive team display with indentation
- `TeamEditForm` - Team editing with member management
- `MemberManagement` - Add/remove/update team members

### Directory Structure
```
src/
├── app/
│   ├── api/                 # API routes (teams, members, users)
│   ├── teams/[id]/edit/    # Team edit page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx           # Homepage with TeamsHierarchy
│   └── globals.css        # Global styles
├── components/             # React components
├── lib/
│   ├── db.ts              # PostgreSQL connection pool
│   └── queries.ts         # Raw SQL query functions
├── types/
│   └── index.ts           # TypeScript interfaces
└── database/
    ├── schema.sql         # Database schema
    └── seed.sql           # Sample data
```

### Key Features Implemented
- Hierarchical team display with visual indentation
- Team CRUD operations with parent team selection
- Member management (add/remove/role changes/status)
- Full path display for teams (e.g., "Engineering > Frontend > React Team")
- Real-time UI updates without page refreshes
- Dark mode support via CSS variables

### Database Query Patterns
- Uses parameterized queries to prevent SQL injection
- LEFT JOINs to fetch teams with members efficiently
- Recursive logic in JavaScript for hierarchy building
- Custom path calculation for team breadcrumbs

### Environment Variables
- Database connection configured via `.env.local`
- Default PostgreSQL settings for local development
- Example file provided as `.env.local.example`