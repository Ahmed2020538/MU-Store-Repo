# MU Store

A premium Egyptian women's shoes & bags e-commerce platform. MU sells handcrafted luxury shoes and bags in the 700–2500 EGP range, with a deep midnight navy and champagne gold brand identity.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mu-store run dev` — run the storefront (port 20605)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Framer Motion + Wouter
- API: Express 5 + JWT auth (jsonwebtoken + bcryptjs)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- API spec: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/`
- API routes: `artifacts/api-server/src/routes/`
- Auth utilities: `artifacts/api-server/src/lib/auth.ts`
- Generated hooks: `lib/api-client-react/src/generated/`
- Generated Zod schemas: `lib/api-zod/src/generated/`
- Frontend: `artifacts/mu-store/src/`

## Architecture decisions

- JWT stored in localStorage (mu_token / mu_user) — stateless auth
- In-memory cart (session-based key) — for simplicity; syncs on login
- PostgreSQL used instead of SQLite (Replit managed DB)
- All AI/Try-On features omitted for token limit reasons; core shopping flow prioritized
- bcryptjs (pure JS) used instead of bcrypt (native) to avoid build script approval

## Product

MU is a luxury Egyptian women's footwear and accessories brand. Features:
- Full product catalog with filters (category, price, size, color, sort)
- Product detail with gallery, size/color selection, reviews
- Cart with promo code support (MU20=20%off, FREESHIP=free ship)
- Checkout with 3 steps: delivery info, payment, confirm
- Egyptian governorates dropdown (all 27)
- User auth (register/login/JWT)
- Order tracking
- Admin dashboard: KPIs, revenue charts, order management, product CRUD
- Loyalty points system
- Arabic/English support (content stored in both)

## User preferences

- Mindful of token limits — keep files focused and under 250 lines each

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes
- Run `pnpm --filter @workspace/db run push` after schema changes
- Admin credentials: admin@mu.com / MUadmin2025
- Promo codes: MU20 (20% off), FREESHIP (free shipping), WELCOME10 (10% off)
- bcrypt was replaced with bcryptjs to avoid native build script requirement

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
