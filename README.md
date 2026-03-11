# Carol

Internal lunch ordering and pickup tracking app for **Hanwha Vision Europe EHQ** staff.

## Features

- Weekly menu published by admin each week
- Staff place / cancel lunch orders with automatic cutoff enforcement (Europe/London timezone)
- PPTX menu import — upload the weekly menu PowerPoint directly
- Exception requests for post-cutoff situations
- Admin: user management, daily order view, pickup tracking, submission log
- Append-only audit log for all significant actions

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database & Auth**: Supabase (PostgreSQL + RLS)
- **UI**: shadcn/ui v4 (`@base-ui/react`) + Tailwind CSS v4
- **Deployment**: Vercel

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
```

### 3. Run database migrations

In Supabase Dashboard → SQL Editor, run the following files in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_indexes.sql
supabase/migrations/004_triggers_functions.sql
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Create your first admin account

Sign up at `/login` with your `@hanwha.com` email, then run in Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin', is_allowed = true WHERE email = 'you@hanwha.com';
```

## Documentation

- [IMPLEMENTATION.md](./IMPLEMENTATION.md) — technical implementation details, architecture decisions, and feature status
- [USER_GUIDE.md](./USER_GUIDE.md) — usage guide for staff and administrators

## Order Cutoff Rules

| Lunch day | Cutoff |
|---|---|
| Monday | Same Monday 09:15 London time |
| Tuesday – Friday | Previous day 16:00 London time |

Cutoff is DST-aware using `Intl.DateTimeFormat` for Europe/London.
