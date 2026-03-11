-- Carol MVP: Initial Schema
-- Run this in Supabase SQL Editor

-- Enable btree_gist extension for EXCLUDE constraint on orders
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL UNIQUE,
  full_name   text,
  role        text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_allowed  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- RESTAURANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  notes       text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- MENU WEEKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.menu_weeks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start   date NOT NULL UNIQUE,
  is_published boolean NOT NULL DEFAULT false,
  created_by   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT week_start_is_monday CHECK (EXTRACT(DOW FROM week_start) = 1)
);

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.menu_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_week_id   uuid NOT NULL REFERENCES public.menu_weeks(id) ON DELETE CASCADE,
  restaurant_id  uuid REFERENCES public.restaurants(id) ON DELETE SET NULL,
  day_of_week    smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  name           text NOT NULL,
  description    text,
  dietary_tags   text[] NOT NULL DEFAULT '{}',
  is_available   boolean NOT NULL DEFAULT true,
  display_order  smallint NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ORDERS (core)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  menu_item_id    uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
  order_date      date NOT NULL,
  status          text NOT NULL DEFAULT 'placed'
                  CHECK (status IN (
                    'placed', 'cancelled', 'submitted', 'delivered',
                    'picked_up', 'no_show_candidate', 'no_show'
                  )),
  special_notes   text,
  cancelled_at    timestamptz,
  cancelled_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  -- Prevent duplicate active orders: one active order per user per day
  CONSTRAINT unique_active_order_per_user_per_day
    EXCLUDE USING gist (user_id WITH =, order_date WITH =)
    WHERE (status <> 'cancelled')
);

-- ============================================================
-- RESTAURANT SUBMISSION LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.restaurant_submission_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_date     date NOT NULL,
  restaurant_id  uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE RESTRICT,
  status         text NOT NULL DEFAULT 'not_submitted'
                 CHECK (status IN (
                   'not_submitted', 'submitted', 'confirmed', 'issue_reported'
                 )),
  submitted_at   timestamptz,
  submitted_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  confirmed_at   timestamptz,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_date, restaurant_id)
);

-- ============================================================
-- EXCEPTION REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exception_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  requested_by    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  request_type    text NOT NULL CHECK (request_type IN ('late_cancel', 'late_order', 'other')),
  reason          text NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
  reviewed_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  resolution_note text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  body         text NOT NULL,
  type         text NOT NULL DEFAULT 'general'
               CHECK (type IN ('general', 'menu_change', 'closure')),
  target_date  date,
  is_active    boolean NOT NULL DEFAULT true,
  created_by   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- AUDIT LOGS (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          bigserial PRIMARY KEY,
  actor_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email text,
  action      text NOT NULL,
  target_type text,
  target_id   text,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
