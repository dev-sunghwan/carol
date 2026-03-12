# Carol

Internal lunch ordering and pickup tracking app for **Hanwha Vision Europe EHQ** staff.

Replaces the previous manual workflow (email/chat requests + spreadsheets) with a traceable web app that enforces order cutoffs, tracks pickups, and maintains an audit trail.

---

## Features

### For Staff
- View the weekly lunch menu (Mon–Fri)
- Place and cancel lunch orders — cutoff is automatically enforced
- Self-record pickup via a QR code scan at the counter
- View order history in My Orders
- Submit exception requests for post-cutoff situations

### For Admins
- Publish weekly menus — enter items manually or import via PPTX upload
- Manage users: grant/revoke ordering access, change roles, pre-register accounts
- Daily order view with CSV export
- Pickup tracking: mark pickups, flag no-shows, confirm no-shows
- Add/remove guest orders per day
- Announcements: post notices visible on the home page
- Audit log: all significant actions recorded with actor, timestamp, and context

---

## Order Cutoff Rules

| Lunch day | Order cutoff |
|---|---|
| Monday | Same Monday **09:15** London time |
| Tuesday – Friday | Previous day **16:00** London time |

Cutoff is DST-aware and calculated server-side using `Intl.DateTimeFormat` for Europe/London. Client-side state is display-only — the server always re-validates.

---

## Access Control

- Sign-up is restricted to `@hanwha.com` email addresses (enforced at both Supabase Auth and DB trigger level)
- New accounts start with `is_allowed = false` — an admin must grant ordering access
- Admins can pre-register accounts directly without waiting for self-signup

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| UI | shadcn/ui v4 (`@base-ui/react`) + Tailwind CSS v4 |
| Deployment | Vercel |
| Timezone | `Intl.DateTimeFormat` — Europe/London, DST-correct |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
```

### 3. Run database migrations

In Supabase Dashboard → SQL Editor, run the following files **in order**:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_indexes.sql
supabase/migrations/004_triggers_functions.sql
supabase/migrations/005_guest_orders.sql
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

---

## Key Routes

| Route | Description |
|---|---|
| `/` | Home — this week's menu + order buttons |
| `/orders` | My Orders — history and cancel |
| `/checkin` | QR code landing page for self-pickup |
| `/admin` | Admin dashboard — today's summary |
| `/admin/menu` | Menu management — create, edit, publish weeks |
| `/admin/users` | User management — allowlist, roles |
| `/admin/daily/[date]` | Daily order list with guest management + CSV export |
| `/admin/pickup/[date]` | Pickup tracking — mark pickups, flag no-shows |
| `/admin/exceptions` | Exception request queue |
| `/admin/announcements` | Announcements CRUD |

---

## Documentation

- [IMPLEMENTATION.md](./IMPLEMENTATION.md) — architecture, data model, business logic, and feature details
