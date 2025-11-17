# FlowRunner Development Workflow

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Initialize database:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Development Commands

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests with Vitest
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

## Project Structure

- `/app` - Next.js App Router pages and API routes
- `/components` - React components
- `/lib` - Core libraries and utilities
- `/types` - TypeScript type definitions
- `/prisma` - Database schema and migrations
- `/tests` - Test files

## Development Guidelines

1. **Type Safety:** Always use TypeScript strict mode
2. **Validation:** Use Zod schemas for runtime validation
3. **Database:** Use Prisma for all database operations
4. **Styling:** Use Tailwind CSS for styling
5. **State:** Use Zustand for client state management
6. **Testing:** Write tests for critical functionality

## Git Workflow

1. Create feature branch from main
2. Make changes and commit
3. Run tests and linting
4. Create pull request
5. Review and merge

## Milestone Tracking

Track progress using the granular-plan.md file. Check off completed tasks as you work through each milestone.

