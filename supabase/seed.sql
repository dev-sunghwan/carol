-- Carol MVP: Development Seed Data
-- Run ONLY in development after all migrations
-- Replace <ADMIN_USER_ID> with a real auth.users uuid after creating the first admin account

-- NOTE: After signing up your first admin user, run this in Supabase SQL Editor:
-- UPDATE public.profiles SET role = 'admin', is_allowed = true WHERE email = 'your-email@hanwha.com';

-- Sample restaurants
INSERT INTO public.restaurants (name, notes) VALUES
  ('Korean Lunch Box', 'Default EHQ lunch provider'),
  ('Hanwha Catering', 'Internal catering option')
ON CONFLICT DO NOTHING;
