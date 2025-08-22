# Team Dashboard

A full-stack team management web application built with Next.js, PostgreSQL, and TypeScript. Features hierarchical team structures with member management capabilities.

## Features

- **Hierarchical Team Display**: View teams in a nested organizational structure
- **Team Management**: Create, edit, and delete teams with full path visibility
- **Member Management**: Add, remove, and manage team members with roles
- **Server-Side Rendering**: Built with Next.js 15 App Router for optimal performance
- **Real-time Updates**: Dynamic UI updates without page refreshes
- **Dark Mode Support**: Automatic theme switching based on system preferences

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with PostgreSQL
- **Database**: PostgreSQL with raw SQL queries (no ORM)
- **Styling**: Tailwind CSS v4 with custom CSS variables
- **Fonts**: Geist font family via next/font/google

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd team-dashboard
npm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a new database named `team_dashboard`
3. Update `.env.local` with your database credentials

#### Option B: Docker PostgreSQL
```bash
docker run --name team-dashboard-db \
  -e POSTGRES_DB=team_dashboard \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:14
```

### 3. Environment Configuration

Copy the environment file and update values if needed:
```bash
cp .env.local.example .env.local
```

Default configuration:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=team_dashboard
```

### 4. Database Schema and Seed Data

```bash
# Run schema creation
psql -U postgres -h localhost -d team_dashboard -f database/schema.sql

# Run seed data (optional, for testing)
psql -U postgres -h localhost -d team_dashboard -f database/seed.sql
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## API Endpoints

### Teams
- `GET /api/teams` - Get all teams in hierarchy
- `POST /api/teams` - Create new team
- `GET /api/teams/[id]` - Get specific team
- `PUT /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team

### Team Members
- `GET /api/teams/[id]/members` - Get team members
- `POST /api/teams/[id]/members` - Add team member
- `PUT /api/members/[id]` - Update member role/status
- `DELETE /api/members/[id]` - Remove team member

### Users
- `GET /api/users` - Get all users

## Database Schema

### Core Tables

**teams**
- `id` (Primary Key)
- `name` (Required)
- `description` (Optional)
- `department` (Optional)
- `parent_id` (Foreign Key to teams.id, nullable for root teams)
- `created_at`, `updated_at` (Timestamps)

**users**
- `id` (Primary Key)
- `name` (Required)
- `email` (Required, Unique)
- `created_at`, `updated_at` (Timestamps)

**team_members**
- `id` (Primary Key)
- `user_id` (Foreign Key to users.id)
- `team_id` (Foreign Key to teams.id)
- `role` (Default: 'member')
- `is_active` (Boolean, default: true)
- `joined_at`, `updated_at` (Timestamps)
- Unique constraint on (user_id, team_id)

## Design Decisions

### Database Query Strategy
- **Raw SQL with pg library**: Chose raw SQL over ORM for explicit control and performance
- **Hierarchical queries**: Custom recursive queries for building team trees
- **Join optimization**: Strategic LEFT JOINs to fetch teams with members in single queries

### Architecture Choices
- **Next.js App Router**: Leverages React Server Components for optimal rendering
- **Component separation**: Clear separation between data fetching, business logic, and UI
- **TypeScript interfaces**: Comprehensive type safety across API boundaries
- **Error handling**: Graceful error states with user-friendly messages

### Query Design Rationale
- **Path calculation**: Dynamic path generation for team hierarchy display
- **Active member filtering**: Supports soft deletion with is_active flag
- **Role-based access**: Flexible role system for future permission expansion

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

## Application Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── teams/          # Team management endpoints
│   │   ├── members/        # Member management endpoints
│   │   └── users/          # User endpoints
│   ├── teams/[id]/edit/    # Team edit page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── TeamsHierarchy.tsx  # Main team display
│   ├── TeamCard.tsx        # Individual team cards
│   ├── TeamEditForm.tsx    # Team editing interface
│   ├── MemberManagement.tsx # Member management UI
│   └── LoadingSpinner.tsx  # Loading component
├── lib/
│   ├── db.ts               # Database connection
│   └── queries.ts          # Database query functions
└── types/
    └── index.ts            # TypeScript type definitions
```

## Production Deployment Considerations

### Database
- Use connection pooling for production databases
- Implement database migrations for schema updates
- Consider read replicas for scaling read operations
- Set up regular backups

### Security
- Environment variable validation
- SQL injection protection (parameterized queries)
- Rate limiting on API endpoints
- Authentication and authorization system

### Performance
- Database indexing on frequently queried columns
- Caching layer (Redis) for team hierarchies
- CDN for static assets
- Image optimization for user avatars

### Monitoring
- Application performance monitoring (APM)
- Database query performance tracking
- Error logging and alerting
- Health check endpoints

## Testing

The application includes comprehensive TypeScript types and error handling. For production use, consider adding:

- Unit tests for database queries
- Integration tests for API endpoints  
- E2E tests for user workflows
- Performance testing for large team hierarchies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Test thoroughly with sample data
5. Submit a pull request

## License

This project is licensed under the MIT License.
