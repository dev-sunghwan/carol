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
| QR Code | `qrcode.react` |
| Deployment | Vercel (planned) |

---

## Database Schema

### Tables

| Table | Description |
|---|---|
| `profiles` | Extends `auth.users` — stores first/last name, role, allowlist status |
| `restaurants` | Lunch providers (e.g. "Korean Lunch") |
| `menu_weeks` | One record per week (keyed by `week_start` Monday date) |
| `menu_items` | Individual dishes per day — linked to `menu_weeks` and `restaurants` |
| `orders` | One active order per user per lunch date; guests use `guest_name` column |
| `exception_requests` | Post-cutoff order requests (late order / cancellation) |
| `announcements` | Admin-authored notices shown to all users |
| `audit_logs` | Append-only log of all significant actions |

### Key Constraints

- **Duplicate order prevention**: `EXCLUDE USING gist (user_id WITH =, order_date WITH =) WHERE (status <> 'cancelled' AND guest_name IS NULL)` — one active order per user per day; guest orders bypass this constraint.
- **Email domain restriction**: DB trigger `enforce_hanwha_email()` rejects non-`@hanwha.com` addresses at insert time.
- **Role checks**: `is_admin()` and `is_allowed_user()` helper functions as `SECURITY DEFINER` used in all RLS policies.

### `orders` — extra columns added post-migration

| Column | Type | Notes |
|---|---|---|
| `guest_name` | `text` (nullable) | Set to `'Guest'` for admin-added guest orders; NULL for regular user orders |
| `menu_item_id` | `uuid` (nullable) | Made nullable to support menu-less guest orders |

---

## Authentication

- Email + password and magic link (Supabase Auth)
- Domain restricted to `@hanwha.com` at DB trigger level
- New users are created with `is_allowed = false` — admin must explicitly grant access
- Session managed via Supabase SSR cookies; middleware refreshes session on every request
- Post-login redirect: `?next=` query param preserved through login flow (used by QR checkin)

---

## Business Rules

### Order Cutoff (Europe/London, DST-aware)

| Day | Cutoff |
|---|---|
| Monday lunch | Same Monday at 09:15 |
| Tuesday–Friday lunch | Previous day at 16:00 |

Implemented in `lib/cutoff.ts` using `Intl.DateTimeFormat` (not `@date-fns/tz`) for correct DST handling.

### Order Status Flow

```
placed → submitted → delivered
                       ↓  (admin: bulk mark)
                  no_show_candidate
                       ↓  (admin: confirm)
                    no_show

placed / submitted / delivered
                       ↓  (user or admin: self-pickup / admin check)
                    picked_up
```

---

## Feature Implementation Status

### Completed ✓

| Feature | Location |
|---|---|
| Database schema + migrations | `supabase/migrations/001–004` |
| RLS policies + helper functions | `supabase/migrations/002` |
| Auth pages (login, magic link, callback) | `app/(auth)/`, `app/login/` |
| Middleware (session refresh + redirect) | `middleware.ts` |
| Home page — weekly menu view | `app/(app)/page.tsx` |
| Menu components (WeeklyMenuGrid, DayLunchCard, CutoffBadge) | `components/menu/` |
| Place / cancel order server actions | `lib/actions/order.actions.ts` |
| Exception request submission | `lib/actions/order.actions.ts` |
| My Orders page (with self-pickup button for today's orders) | `app/(app)/orders/` |
| Admin — user management (allowlist, role, first/last name) | `app/(app)/admin/users/` |
| Admin — menu management (create week, edit items, publish) | `app/(app)/admin/menu/` |
| Admin — PPTX menu import | `lib/pptx-parser.ts`, `app/api/admin/import-menu/`, `components/admin/MenuImportDialog.tsx` |
| Admin — daily orders page (date nav, order count, status) | `app/(app)/admin/daily/[date]/page.tsx` |
| Admin — guest order add/remove | `components/admin/AddGuestButton.tsx`, `RemoveGuestButton.tsx`, `lib/actions/admin/guest.actions.ts` |
| Admin — pickup & no-show management | `app/(app)/admin/pickup/[date]/page.tsx`, `lib/actions/admin/pickup.actions.ts` |
| Admin — exception request review | `app/(app)/admin/exceptions/`, `lib/actions/admin/exception.actions.ts` |
| QR code checkin — admin display | `components/admin/CheckinQRCode.tsx` |
| QR code checkin — user self-pickup page | `app/(app)/checkin/page.tsx`, `components/orders/PickupButton.tsx` |
| CSV daily order export | `app/api/admin/daily-csv/route.ts` |
| Audit logging | `lib/audit.ts` |
| TypeScript: zero errors | `npx tsc --noEmit` ✓ |

### Pending

| Feature | Notes |
|---|---|
| Announcements CRUD | Schema exists; UI not built |
| Error boundaries / loading states | Minimal currently |
| Audit log viewer (admin) | Not started |

---

## PPTX Menu Import

Admin can upload the weekly menu PowerPoint file directly:

- **Parser**: `lib/pptx-parser.ts` — reads PPTX as ZIP, extracts table XML, maps columns (Mon–Fri) to `day_of_week` and rows to `display_order`
- **API route**: `POST /api/admin/import-menu` — supports `previewOnly` mode before committing
- **UI**: `MenuImportDialog` — file picker + week date input + preview table + confirm import

Expected PPTX format: one slide, one table, first row = day headers (Monday–Friday).

---

## QR Code Pickup Flow

1. Admin opens Daily Orders page → clicks "Show QR Code" → displays QR for `/checkin`
2. Print and place QR at the pickup counter
3. Staff scan → browser opens `/checkin` → if not logged in, redirected to login with `?next=/checkin`
4. After login, auto-redirected back to `/checkin`
5. Page shows today's order; user clicks "Confirm Pickup" → order status → `picked_up`
6. Self-pickup button also available directly in My Orders page for today's post-cutoff orders

---

## Guest Order Flow

For visiting staff (KHQ, other affiliates) who don't have a Carol account:

1. Admin opens Daily Orders for the relevant date
2. Clicks "+ Add Guest" → inserts a guest order row (`guest_name = 'Guest'`, `menu_item_id = null`)
3. Each guest row shows an amber "Guest" badge + "Remove" link
4. Guest orders are excluded from the duplicate-order constraint, so multiple guests per day are allowed
5. Guest orders appear in the total order count and in the daily CSV export

---

## Key Technical Decisions

| Decision | Reason |
|---|---|
| No `<Database>` generic on Supabase clients | Joined queries infer `never` with manual type; removed from all three clients |
| `ButtonLink` component instead of `Button asChild` | `@base-ui/react` does not support `asChild` prop |
| `buttonVariants()` className on `<DialogTrigger>` | `DialogTrigger` renders as `<button>`; nesting `<Button>` inside causes button-in-button hydration error |
| `Intl.DateTimeFormat` for timezone | DST-correct; replaced `@date-fns/tz` |
| Service role client only in `lib/audit.ts` | Audit writes bypass RLS; never imported in client code |
| `profiles!orders_user_id_fkey` FK hint in queries | `orders` has two FKs to `profiles` (user_id + cancelled_by); PostgREST requires explicit hint to avoid PGRST201 ambiguity error |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...   # Publishable (Anon) Key
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # Secret Key (server-only)
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

---

## Supabase Migration Notes

Migrations applied after initial schema (run manually in SQL Editor):

```sql
-- Guest order support (added post-004)
ALTER TABLE orders ADD COLUMN guest_name text;
ALTER TABLE orders ALTER COLUMN menu_item_id DROP NOT NULL;
ALTER TABLE orders DROP CONSTRAINT unique_active_order_per_user_per_day;
ALTER TABLE orders ADD CONSTRAINT unique_active_order_per_user_per_day
  EXCLUDE USING gist (user_id WITH =, order_date WITH =)
  WHERE (status <> 'cancelled' AND guest_name IS NULL);
CREATE POLICY "orders: admin inserts"
  ON public.orders FOR INSERT
  WITH CHECK (public.is_admin());
```
