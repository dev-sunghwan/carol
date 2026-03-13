# Carol — Tech Stack Reference

## Overview

Carol is a server-rendered web application built with a modern TypeScript stack, designed for low operational overhead. There are no custom backend servers to manage — all infrastructure is either managed cloud services or serverless.

---

## Core Framework

### Next.js 16 (App Router)
- **What it is:** React-based web framework developed by Vercel
- **Why it's used:** Handles both the UI and the backend API in a single codebase. The App Router model allows server-side data fetching and Server Actions (functions that run on the server, called directly from UI components), which eliminates the need for a separate API backend
- **Key patterns used:**
  - Server Components: pages that fetch data directly from the database on the server
  - Server Actions: form submissions and mutations (place order, cancel order, etc.) run server-side with no API endpoint needed
  - Route Handlers: used for CSV export endpoints (`/api/admin/...`)
  - `proxy.ts`: runs on every request for session refresh and auth-gating

### TypeScript
- **What it is:** Typed superset of JavaScript
- **Why it's used:** Catches type mismatches at compile time, reducing runtime errors. All Carol code is TypeScript with `strict` mode enabled

---

## Database & Authentication

### Supabase
- **What it is:** Open-source Firebase alternative — provides PostgreSQL database, authentication, and auto-generated REST/Realtime APIs
- **URL:** [supabase.com](https://supabase.com)
- **Components used:**

| Component | Usage |
|---|---|
| PostgreSQL | Main database (orders, profiles, menus, audit logs) |
| Supabase Auth | Magic link + password-based login; email domain restriction (@hanwha.com) |
| Row Level Security (RLS) | Database-level access control — users can only read/write their own data |
| Storage | Not used (PPTX files are parsed in-memory, not stored) |

- **Client types:**
  - `supabase/client.ts` — browser-side client (for auth state, real-time)
  - `supabase/server.ts` — server-side client (for Server Components, Server Actions)
  - `supabase/admin.ts` — service role client with RLS bypass (used only for audit log writes and admin operations)

---

## UI Framework

### React 19
- **What it is:** JavaScript library for building user interfaces
- **Usage:** All Carol UI components are React components. Server Components run on the server; Client Components (`"use client"`) run in the browser

### Tailwind CSS v4
- **What it is:** Utility-first CSS framework — styles are written as class names directly in HTML/JSX
- **Why it's used:** Rapid UI development without writing separate CSS files. Responsive design (`sm:`, `md:` prefixes) is built-in

### shadcn/ui v4
- **What it is:** A collection of pre-built UI components (Button, Card, Dialog, Table, etc.) built on `@base-ui/react`
- **Note:** shadcn/ui v4 uses `@base-ui/react` as its primitive layer (not Radix UI as in older versions). This means some patterns differ — notably, `asChild` prop is not supported

### Sonner
- **What it is:** Toast notification library for React
- **Usage:** Success/error toasts when placing orders, cancelling, etc.

---

## File Processing

### PPTX Parser (custom, `lib/pptx-parser.ts`)
- **What it does:** Parses the weekly menu PowerPoint file uploaded by admin
- **How it works:** Uses `jszip` (ZIP extraction) + XML parsing to read slide content. Extracts menu item names and descriptions from slide text. File is processed entirely in-memory — the original file is never stored

### jszip
- **What it is:** JavaScript library to read/write ZIP files (PPTX files are ZIP archives internally)

---

## Hosting & Deployment

### Vercel
- **What it is:** Cloud platform optimised for Next.js — handles build, deployment, CDN, and serverless function execution
- **URL:** [vercel.com](https://vercel.com)
- **How it works:** When code is pushed to the `main` branch on GitHub (and auto-deploy is enabled), Vercel automatically builds and deploys the app. Each deployment gets a unique URL; the production URL stays fixed
- **Serverless:** There are no always-on servers. Next.js pages and API routes run as serverless functions, billed per request

---

## Key Libraries Summary

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.x | Framework |
| `react` / `react-dom` | 19.x | UI runtime |
| `typescript` | 5.x | Type safety |
| `tailwindcss` | 4.x | Styling |
| `@supabase/ssr` | latest | Supabase client with cookie-based auth |
| `@supabase/supabase-js` | latest | Supabase JS client |
| `@base-ui/react` | latest | shadcn/ui v4 primitives |
| `sonner` | latest | Toast notifications |
| `jszip` | latest | PPTX file parsing |
| `date-fns` | latest | Date formatting (audit log) |
| `qrcode.react` | latest | QR code generation for checkin |

---

## Architecture Diagram

```
Browser
  │
  ├─ React Client Components (order buttons, forms)
  │     │
  │     └─ Server Actions ──→ Supabase DB (via server client)
  │
  ├─ Next.js Server Components ──→ Supabase DB (direct query)
  │
  ├─ proxy.ts (every request) ──→ Supabase Auth (session refresh)
  │
  └─ API Routes (/api/admin/...) ──→ Supabase DB (admin client)

Vercel (hosting) ←── GitHub (code)
Supabase Cloud (DB + Auth)
```

---

## Environment Variables

| Variable | Used in | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client + Server | Public anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (admin client) | Bypasses RLS — keep secret |
