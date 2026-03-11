-- Carol MVP: RLS Policies
-- Run after 001_initial_schema.sql

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_allowed_user()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_allowed = true
  );
$$;

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles: user reads own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile (cannot change role or is_allowed)
CREATE POLICY "profiles: user updates own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND is_allowed = (SELECT is_allowed FROM public.profiles WHERE id = auth.uid())
  );

-- Admins can read all profiles
CREATE POLICY "profiles: admin reads all"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Admins can update all profiles (manage roles and allowlist)
CREATE POLICY "profiles: admin updates all"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Allow inserts via trigger (service role) and admin
CREATE POLICY "profiles: service role inserts"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- RESTAURANTS
-- ============================================================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurants: authenticated reads active"
  ON public.restaurants FOR SELECT
  USING (auth.uid() IS NOT NULL AND (is_active = true OR public.is_admin()));

CREATE POLICY "restaurants: admin all"
  ON public.restaurants FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- MENU WEEKS
-- ============================================================
ALTER TABLE public.menu_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_weeks: authenticated reads published"
  ON public.menu_weeks FOR SELECT
  USING (auth.uid() IS NOT NULL AND (is_published = true OR public.is_admin()));

CREATE POLICY "menu_weeks: admin all"
  ON public.menu_weeks FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- MENU ITEMS
-- ============================================================
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_items: authenticated reads published weeks"
  ON public.menu_items FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.menu_weeks mw
      WHERE mw.id = menu_week_id AND (mw.is_published = true OR public.is_admin())
    )
  );

CREATE POLICY "menu_items: admin all"
  ON public.menu_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- ORDERS
-- ============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "orders: user reads own"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid());

-- Allowed users can place orders (for themselves)
CREATE POLICY "orders: allowed user inserts"
  ON public.orders FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND public.is_allowed_user()
  );

-- Users can update their own orders (cancellation)
CREATE POLICY "orders: user updates own"
  ON public.orders FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can read all orders
CREATE POLICY "orders: admin reads all"
  ON public.orders FOR SELECT
  USING (public.is_admin());

-- Admins can update any order (status management, no-show, pickup)
CREATE POLICY "orders: admin updates all"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- RESTAURANT SUBMISSION LOG
-- ============================================================
ALTER TABLE public.restaurant_submission_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submission_log: admin all"
  ON public.restaurant_submission_log FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- EXCEPTION REQUESTS
-- ============================================================
ALTER TABLE public.exception_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own requests
CREATE POLICY "exception_requests: user reads own"
  ON public.exception_requests FOR SELECT
  USING (requested_by = auth.uid());

-- Users can create requests (must be for themselves)
CREATE POLICY "exception_requests: user inserts"
  ON public.exception_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid() AND public.is_allowed_user());

-- Admins can do everything
CREATE POLICY "exception_requests: admin all"
  ON public.exception_requests FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements: authenticated reads active"
  ON public.announcements FOR SELECT
  USING (auth.uid() IS NOT NULL AND (is_active = true OR public.is_admin()));

CREATE POLICY "announcements: admin all"
  ON public.announcements FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- AUDIT LOGS
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read logs
CREATE POLICY "audit_logs: admin reads"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

-- Inserts only via service role (in lib/audit.ts using supabaseAdmin)
-- No UPDATE or DELETE policies — effectively immutable
CREATE POLICY "audit_logs: service role inserts"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
