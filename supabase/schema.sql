-- ==============================================================================
-- FlowIQ Supabase Database Schema
-- Hospital Queue & Crowd Management System
-- ==============================================================================

-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'staff', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Stethoscope',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Counters Table
CREATE TABLE IF NOT EXISTS public.counters (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'busy')),
  current_serving INTEGER DEFAULT 0,
  avg_service_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tokens Table
CREATE TABLE IF NOT EXISTS public.tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token_number INTEGER NOT NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  counter_id TEXT NOT NULL REFERENCES public.counters(id) ON DELETE CASCADE,
  custom_department TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'served', 'cancelled', 'no_show')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  served_at TIMESTAMPTZ,
  estimated_wait_minutes INTEGER DEFAULT 0,
  actual_wait_minutes INTEGER,
  position_in_queue INTEGER DEFAULT 1
);

-- 5. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token_id TEXT REFERENCES public.tokens(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Analytics Table (Historical logs for AI Crowd Prediction)
CREATE TABLE IF NOT EXISTS public.analytics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  total_tokens INTEGER DEFAULT 0,
  avg_wait_minutes NUMERIC DEFAULT 0,
  peak_crowd INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES public.departments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  type TEXT NOT NULL DEFAULT 'turn_alert' CHECK (type IN ('token_confirm', 'almost_turn', 'turn_alert', 'crowd_warning', 'broadcast')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tokens_department_status ON public.tokens(department_id, status);
CREATE INDEX IF NOT EXISTS idx_tokens_patient_id ON public.tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_counters_department ON public.counters(department_id);
CREATE INDEX IF NOT EXISTS idx_analytics_dept_date ON public.analytics(department_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Read policies (allow authenticated and anon reads for public queue stats)
CREATE POLICY "Allow public read access on departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow public read access on counters" ON public.counters FOR SELECT USING (true);
CREATE POLICY "Allow public read access on tokens" ON public.tokens FOR SELECT USING (true);
CREATE POLICY "Allow public insert on tokens" ON public.tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on tokens" ON public.tokens FOR UPDATE USING (true);
CREATE POLICY "Allow public read on feedback" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Allow public insert on feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on analytics" ON public.analytics FOR SELECT USING (true);
CREATE POLICY "Allow public read on notifications" ON public.notifications FOR SELECT USING (true);
