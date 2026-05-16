# HomeManager - Agent Instructions

## Project Overview
Next.js 16 (App Router) + React 19 + Prisma + PostgreSQL + Clerk. Web app for household management in Venezuela (bimonetary: USD/VES).

## Required Commands

```bash
# Development
npm run dev                    # Start with Turbopack
npm run build                  # Production build

# Verification (always run before committing)
npm run typecheck             # Must pass
npm run lint                  # Must pass
npm run build                 # Must succeed

# Database
npm run db:push               # Sync Prisma schema to DB
npm run db:generate           # Generate Prisma Client
npm run db:studio             # Open Prisma GUI
```

## Path Aliases (must use)

| Alias | Path |
|-------|------|
| `@shared/*` | `src/shared/*` |
| `@shadcn/*` | `src/shadcn/*` |
| `@lib/*` | `src/shared/lib/*` |
| `@hooks/*` | `src/shared/hooks/*` |
| `@styles/*` | `src/styles/*` |

**Important**: Use `@shared/` NOT `@/shared/` - the slash after @ is incorrect.

## Architecture

- **Auth**: Clerk with middleware protection on `/d/*`
- **Database**: Prisma 7 with PostgreSQL (requires `pg` + `@prisma/adapter-pg`)
- **State**: Zustand for client state, Server Actions for mutations
- **Forms**: React Hook Form + Zod
- **Components**: shadcn/ui (located in `@shadcn/components/ui/`)

## Key Files

- `src/app/d/layout.tsx` - Dashboard layout with auto-sync user to DB on every request
- `src/shared/lib/auth-sync.ts` - Sync Clerk user to Prisma on login
- `src/shared/lib/prisma.ts` - Prisma client (uses adapter pattern for Prisma 7)
- `src/modules/*/` - Feature modules following the pattern

## Database Setup

1. Ensure PostgreSQL is running
2. Set `DATABASE_URL` in `.env.local` (format: `postgresql://user:pass@host:5432/db?schema=public`)
3. Run `npm run db:push` to create/sync tables

## Prisma 7 Notes

Prisma 7 changed initialization. Use adapter pattern:
```typescript
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })
```

## Clerk Setup

Get keys from clerk.com and add to `.env.local`:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- Use `signInFallbackRedirectUrl` and `signUpFallbackRedirectUrl` (NOT deprecated `afterSignInUrl`)

## Module Architecture

Each feature module follows this pattern:
```
src/modules/<module>/
├── actions/
│   └── <module>-actions.ts       # Server Actions (Prisma)
├── components/
│   ├── <Module>View.tsx          # Main view
│   ├── <Module>Form.tsx          # CRUD form
│   └── ui/columns.tsx            # Table columns
├── utils/
│   └── form-schema.ts            # Zod schema + types
└── types.ts
```

## Development Phases

| Phase | Focus | Modules |
|-------|-------|---------|
| 1 | Foundation | Auth (Clerk), Prisma, Layout, Dashboard, Currencies |
| 2 | Finance | Accounts, Transactions, Categories, Beneficiaries, Exchange Rates |
| 3 | Inventory | Pantry, Shopping List, Services |
| 4 | Tasks | Home Tasks, Profile, Settings |

## Tailwind v4 Notes

- Uses `@import "tailwindcss"` syntax (not `@tailwind` directives)
- Custom theme vars defined in `src/styles/globals.css` via `@theme inline`
- CSS variables use `oklch()` color space

## Known Gotchas

- TypeScript strict mode enabled
- shadcn components import from `@shadcn/components/ui/*`
- Always run `db:generate` after modifying Prisma schema
- Dashboard routes are protected; unauthorized users redirected to `/login`
- Use `@shared/` paths, NOT `@/shared/` (double slash is wrong)
- Prisma 7 requires adapter pattern (`@prisma/adapter-pg` + `pg`)

## Database Models (Prisma Schema)

16 models: User, Household, UserProfile, UserSettings, Currency, Account, Category, Beneficiary, ExchangeRate, Transaction, PantryItem, ShoppingItem, HomeService, ServicePayment, HomeTask