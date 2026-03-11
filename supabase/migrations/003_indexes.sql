-- Carol MVP: Indexes
-- Run after 002_rls_policies.sql

-- Orders: frequent queries by date, user, and status
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_date ON public.orders(user_id, order_date);

-- Menu items: joining to week + day
CREATE INDEX IF NOT EXISTS idx_menu_items_week ON public.menu_items(menu_week_id, day_of_week);

-- Menu weeks: week_start for current-week lookups
CREATE INDEX IF NOT EXISTS idx_menu_weeks_week_start ON public.menu_weeks(week_start DESC);

-- Exception requests: admin queue sorted by pending
CREATE INDEX IF NOT EXISTS idx_exception_requests_status ON public.exception_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_exception_requests_user ON public.exception_requests(requested_by, created_at DESC);

-- Audit logs: reverse-chronological lookups by actor and target
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Announcements: active ones for home page display
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active, created_at DESC);

-- Restaurant submission log: by date
CREATE INDEX IF NOT EXISTS idx_submission_log_date ON public.restaurant_submission_log(order_date DESC);
