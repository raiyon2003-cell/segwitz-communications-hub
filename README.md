# SegWitz Communications Hub (SCH)

Production-ready centralized communication platform for SegWitz staff.

## Features

- **Authentication** — Supabase Auth with role-based access (Admin, Department Manager, Staff, View Only)
- **Template Management** — Rich text and HTML templates with variable engine and approval workflow
- **Contact Management** — Full CRUD with search, filter, and pagination
- **Email Composer** — Template selection, variable forms, attachments, and preview
- **Brevo Integration** — Transactional email sending with encrypted API key storage
- **Email History** — Full audit trail with CSV/Excel export
- **Dashboard** — Real-time stats and Recharts visualizations
- **Communication Timeline** — Per-contact chronological history
- **External API** — `/api/v1/send-email` for future SegWitz integrations

## Tech Stack

- Next.js 16 (App Router)
- Supabase (Auth, PostgreSQL, Storage)
- Prisma 7 ORM
- TailwindCSS + Shadcn UI
- Brevo API
- Recharts, TanStack Table, React Hook Form, Zod, Zustand

## Quick Start

```bash
npm install
cp .env.example .env.local
# Configure all environment variables

npm run db:push
npm run db:seed
npm run dev
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full setup and Vercel deployment instructions.

## Default Admin (after seed)

- Email: `admin@segwitz.com`
- Password: `Admin123!` (change immediately in production)

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # UI and feature components
├── lib/
│   ├── actions/      # Server Actions
│   ├── auth/         # Session management
│   ├── services/     # Brevo, storage, variables, audit
│   └── validators/   # Zod schemas
prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Seed script
supabase/
└── rls-policies.sql  # Row Level Security
```
