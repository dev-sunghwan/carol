# Carol — Implementation Summary

## Overview

Carol is an internal lunch ordering and pickup tracking web application for Hanwha Vision Europe EHQ staff. Built with Next.js (App Router), Supabase, and Tailwind CSS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| UI Components | shadcn/ui v4 (`@base-ui/react`) |
| Styling | Tailwind CSS v4 |
| Notifications | Sonner (toast) |
| Deployment | Vercel (planned) |

---

## Database Schema

### Tables

| Table | Description |
|---|---|
| `profiles` | Extends `auth.users` — stores name, phone, role, allowlist status |
| `restaurants` | Lunch providers (e.g. "Korean Lunch") |
| `menu_weeks` | One record per week (keyed by `week_start` Monday date) |
| `menu_items` | Individual dishes per day — linked to `menu_weeks` and `restaurants` |
| `orders` | One order per user per lunch date — enforced via `EXCLUDE` constraint |
| `restaurant_submission_log` | Tracks whether admin has submitted the day's orders to the restaurant |
| `exception_requests` | Post-cutoff order requests (late/cancel/change) |
| `announcements` | Admin-authored notices shown to all users |
| `audit_logs` | Append-only log of all significant actions |

### Key Constraints

- **Duplicate order prevention**: `EXCLUDE USING gist (user_id WITH =, order_date WITH =) WHERE (status <> 'cancelled')` — database-level guarantee, one active order per user per day.
- **Email domain restriction**: DB trigger `enforce_hanwha_email()` rejects non-`@hanwha.com` addresses at insert time.
- **Role check**: `is_admin()` and `is_allowed_user()` helper functions as `SECURITY DEFINER` used in all RLS policies.

---

## Authentication

- Email + password and magic link (Supabase Auth)
- Domain restricted to `@hanwha.com` at DB trigger level
- New users are created with `is_allowed = false` — admin must explicitly grant access
- Session managed via Supabase SSR cookies; middleware refreshes session on every request

---

## Business Rules

### Order Cutoff (Europe/London, DST-aware)

| Day | Cutoff |
|---|---|
| Monday lunch | Same Monday at 09:15 |
| Tuesday–Friday lunch | Previous day at 16:00 |

Implemented in `lib/cutoff.ts` using `Intl.DateTimeFormat` (not `@date-fns/tz`) for correct DST handling.

### Ordering Flow

1. User views the published weekly menu
2. Selects a day and clicks "Order" on any menu item for that day
3. System validates: authenticated → allowed → cutoff not passed → no duplicate
4. Order is created and audit log entry written
5. User can cancel before the cutoff

### Exception Requests

Users who miss the cutoff can submit an exception request (type: late order / cancellation / change). Admin reviews and approves or rejects via `/admin/exceptions`.

---

## Feature Implementation Status

### Completed ✓

| Feature | Location |
|---|---|
| Database schema + migrations | `supabase/migrations/001–004` |
| RLS policies | `supabase/migrations/002` |
| Auth pages (login, callback) | `app/(auth)/` |
| Middleware (session + redirect) | `middleware.ts` |
| Home page — weekly menu view | `app/(app)/page.tsx` |
| Menu components | `components/menu/` |
| Place / cancel order | `lib/actions/order.actions.ts` |
| Exception request submission | `lib/actions/order.actions.ts` |
| My Orders page | `app/(app)/orders/` |
| Admin — user management | `app/(app)/admin/users/` |
| Admin — menu management UI | `app/(app)/admin/menu/` |
| Admin — menu week editor | `components/admin/MenuWeekEditor.tsx` |
| Admin — submissions overview | `app/(app)/admin/submissions/` |
| Admin — exceptions review | `app/(app)/admin/exceptions/` |
| **PPTX menu import** | `lib/pptx-parser.ts`, `app/api/admin/import-menu/`, `components/admin/MenuImportDialog.tsx` |
| User profile editing (name, phone) | `components/admin/UserTable.tsx` |
| Audit logging | `lib/audit.ts` |

### Pending / Partial

| Feature | Notes |
|---|---|
| Admin daily order view | `app/(app)/admin/daily/[date]/page.tsx` |
| Pickup & no-show tracking | UI pending |
| Announcements CRUD | Schema exists, UI pending |
| CSV export | Not started |
| Audit log viewer | Not started |
| Error boundaries / loading states | Minimal currently |

---

## PPTX Menu Import

Admin can upload the weekly menu PowerPoint file directly:

- **Parser**: `lib/pptx-parser.ts` — reads PPTX as ZIP, extracts table XML, maps columns (Mon–Fri) to `day_of_week` and rows to `display_order`
- **API route**: `POST /api/admin/import-menu` — supports `previewOnly` mode before committing
- **UI**: `MenuImportDialog` — file picker + week date input + preview table + confirm import
- **Category labels**: Row 0 = Main, Row 1 = Side 1, Row 2 = Side 2, … (display-time only, no DB column)

Expected PPTX format: one slide, one table, first row = day headers (Monday–Friday).

---

## Key Technical Decisions

| Decision | Reason |
|---|---|
| No `<Database>` generic on Supabase clients | Joined queries infer `never` with manual type; removed from all three clients |
| `ButtonLink` component instead of `Button asChild` | `@base-ui/react` does not support `asChild` prop |
| `buttonVariants()` className on trigger elements | Same reason — styled triggers without `asChild` |
| `Intl.DateTimeFormat` for timezone | DST-correct; `@date-fns/tz` had edge cases |
| Service role client only in `lib/audit.ts` | Audit writes bypass RLS; never imported in client code |
| Append-only audit log | No UPDATE/DELETE RLS on `audit_logs` table |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...       # Publishable Key
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # Secret Key (server-only)
```

---

## Local Development

```bash
cd carol
npm install
cp .env.example .env.local   # fill in Supabase credentials
npm run dev
```

Run migrations in Supabase SQL Editor in order: `001` → `002` → `003` → `004`.

After signing up, promote your account to admin:
```sql
UPDATE profiles SET role = 'admin', is_allowed = true WHERE email = 'you@hanwha.com';
```
