# FlowRunner

AI–Art–Directed, Multi-Screen UI Flow Generator

FlowRunner is a next-generation, AI-driven visual UI composer that transforms natural-language prompts into multi-screen, fully illustrated, themed UI flows.

## Features

- AI-generated hero images for every screen
- Reusable image library with metadata
- 12 layout pattern families with 60 variants
- Zod-validated DSL
- React renderer
- MagicPath-style editing
- Flow navigation builder
- Nano-Banana image editing
- Community gallery
- Export to Figma and Cursor

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Validation:** Zod
- **State:** Zustand
- **Styling:** Tailwind CSS
- **AI:** OpenAI (GPT-4, DALL-E 3)
- **Testing:** Vitest, Playwright

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Initialize database:
```bash
npm run db:generate
npm run db:push
```

4. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run db:studio` - Open Prisma Studio
- `npm run lint` - Run ESLint

## Project Structure

See the build plan for complete project structure documentation.

## License

MIT

