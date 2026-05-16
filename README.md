# Carol

Carol is an internal lunch ordering and pickup tracking app for **Hanwha Vision Europe EHQ** staff.

It was built to replace a manual workflow based on email or chat requests plus spreadsheets with a traceable web app that enforces order cutoffs, tracks pickups, and maintains an audit trail.

## Project status

The core product is implemented and the main workflows are in place. Wider rollout is currently blocked by an organizational dependency rather than a missing feature: company email delivery and account-integration behavior still need alignment with internal security and IT policies before the service can be used reliably in production.

That constraint is part of the project context. Carol is a functional internal-service prototype that has reached the point where adoption depends on resolving real company-environment issues, not only on writing more application code.

## Features

### For staff

- View the weekly lunch menu from Monday to Friday
- Place and cancel lunch orders with server-side cutoff enforcement
- Self-record pickup through a QR code flow at the counter
- View personal order history
- Submit exception requests for post-cutoff cases

### For admins

- Publish weekly menus manually or through PPTX import
- Manage users, roles, and order access
- Review daily orders and export reports
- Track pickups and no-shows
- Add guest orders
- Publish announcements
- Review an audit trail of significant actions

## Order cutoff rules

| Lunch day | Order cutoff |
|---|---|
| Monday | Same Monday **09:15** London time |
| Tuesday-Friday | Previous day **16:00** London time |

Cutoffs are calculated server-side in `Europe/London` time and remain DST-aware. Client-side state is display-only; the server always re-validates the rule.

## Access control

- Sign-up is restricted to `@hanwha.com` addresses
- New accounts start with `is_allowed = false`
- Admins can pre-register users and grant ordering access

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Database and auth | Supabase, PostgreSQL, Row Level Security |
| UI | shadcn/ui v4 and Tailwind CSS v4 |
| Deployment target | Vercel |
| Timezone handling | `Intl.DateTimeFormat` with `Europe/London` |

## Getting started

```bash
npm install
npm run dev
```

Create `.env.local` before running the app:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
```

Run the Supabase migrations in order before first use.

## Key routes

| Route | Description |
|---|---|
| `/` | Weekly menu and order actions |
| `/orders` | Personal order history |
| `/checkin` | QR-based pickup flow |
| `/admin` | Admin dashboard |
| `/admin/menu` | Menu management |
| `/admin/users` | User management |
| `/admin/daily/[date]` | Daily orders and export |
| `/admin/pickup/[date]` | Pickup tracking |
| `/admin/exceptions` | Exception queue |
| `/admin/announcements` | Announcement management |

## Documentation

- `IMPLEMENTATION.md` - architecture, data model, business logic, and implementation details
