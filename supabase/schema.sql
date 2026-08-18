-- ==============================================================================
-- FlowIQ - Smart Hospital Queue & Crowd Intelligence System
-- Complete Supabase PostgreSQL Database Setup Script
-- Project ID: bwpkgcujoqtlcxcntzch
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CREATE TABLES
-- ==============================================================================

-- Table 1: Profiles (Linked to Supabase Auth & Role-Based Access Control)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'staff', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Departments (Hospital Clinics & Specialized Centers)
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Stethoscope',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Counters (Consulting Desks & Triage Stations)
CREATE TABLE IF NOT EXISTS public.counters (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  doctor_name TEXT DEFAULT 'Dr. Robert Sterling',
  staff_name TEXT DEFAULT 'St. Sarah Watson',
  staff_id TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'busy')),
  current_serving INTEGER DEFAULT 0,
  avg_service_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: Tokens (Live Patient Queue Tickets & Clinical Visits)
CREATE TABLE IF NOT EXISTS public.tokens (
  id TEXT PRIMARY KEY DEFAULT ('tok-' || floor(extract(epoch from now()) * 1000)::text),
  counter_id TEXT NOT NULL REFERENCES public.counters(id) ON DELETE CASCADE,
  department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  doctor_name TEXT,
  staff_name TEXT,
  token_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'serving', 'served', 'no_show')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'emergency')),
  triage_reason TEXT,
  is_emergency BOOLEAN DEFAULT FALSE,
  position_in_queue INTEGER DEFAULT 1,
  estimated_wait_minutes INTEGER DEFAULT 0,
  actual_wait_minutes INTEGER,
  custom_department TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  served_at TIMESTAMPTZ
);

-- Table 5: Feedback (Patient Post-Consultation Reviews)
CREATE TABLE IF NOT EXISTS public.feedback (
  id TEXT PRIMARY KEY DEFAULT ('fb-' || floor(extract(epoch from now()) * 1000)::text),
  token_id TEXT REFERENCES public.tokens(id) ON DELETE SET NULL,
  user_id TEXT,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  patient_name TEXT,
  department_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 6: Notifications (Turn Alerts, Queue Chimes & Broadcasts)
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif-' || floor(extract(epoch from now()) * 1000)::text),
  user_id TEXT NOT NULL,
  token_id TEXT,
  department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
  title TEXT,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'queue_update' CHECK (type IN ('queue_update', 'alert', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 7: Analytics (Historical Hourly Traffic for AI Crowd Prediction)
CREATE TABLE IF NOT EXISTS public.analytics (
  id TEXT PRIMARY KEY DEFAULT ('an-' || floor(extract(epoch from now()) * 1000)::text),
  department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  total_tokens INTEGER DEFAULT 0,
  avg_wait_minutes NUMERIC DEFAULT 0,
  peak_crowd_level TEXT DEFAULT 'MODERATE' CHECK (peak_crowd_level IN ('SAFE', 'MODERATE', 'HIGH', 'CRITICAL')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. INDEXES FOR LIGHTNING FAST QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tokens_dept_status ON public.tokens(department_id, status);
CREATE INDEX IF NOT EXISTS idx_tokens_counter_status ON public.tokens(counter_id, status);
CREATE INDEX IF NOT EXISTS idx_tokens_email ON public.tokens(patient_email);
CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON public.tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_counters_department ON public.counters(department_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_analytics_dept_date ON public.analytics(department_id, date);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Allow Public Reads & Writes for Hospital Operational Flow
DROP POLICY IF EXISTS "Public read departments" ON public.departments;
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write departments" ON public.departments;
CREATE POLICY "Public write departments" ON public.departments FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read counters" ON public.counters;
CREATE POLICY "Public read counters" ON public.counters FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write counters" ON public.counters;
CREATE POLICY "Public write counters" ON public.counters FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read tokens" ON public.tokens;
CREATE POLICY "Public read tokens" ON public.tokens FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert tokens" ON public.tokens;
CREATE POLICY "Public insert tokens" ON public.tokens FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update tokens" ON public.tokens;
CREATE POLICY "Public update tokens" ON public.tokens FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write profiles" ON public.profiles;
CREATE POLICY "Public write profiles" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read feedback" ON public.feedback;
CREATE POLICY "Public read feedback" ON public.feedback FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert feedback" ON public.feedback;
CREATE POLICY "Public insert feedback" ON public.feedback FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read notifications" ON public.notifications;
CREATE POLICY "Public read notifications" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write notifications" ON public.notifications;
CREATE POLICY "Public write notifications" ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read analytics" ON public.analytics;
CREATE POLICY "Public read analytics" ON public.analytics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write analytics" ON public.analytics;
CREATE POLICY "Public write analytics" ON public.analytics FOR ALL USING (true);

-- ==============================================================================
-- 5. REAL-TIME REPLICATION (CDC) FOR INSTANT QUEUE UPDATES
-- ==============================================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.counters;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- ==============================================================================
-- 6. SEED DATA (Hospital Departments & Consulting Desks)
-- ==============================================================================

-- Insert Standard Departments
INSERT INTO public.departments (id, name, description, icon, is_active) VALUES
('dept-opd', 'Outpatient Department (OPD)', 'General clinical consultations, preliminary diagnostic screening & primary triage', 'Stethoscope', true),
('dept-emergency', 'Emergency & Critical Care', '24/7 immediate acute care, critical stabilization & urgent trauma triage', 'AlertTriangle', true),
('dept-pharmacy', 'Hospital Central Pharmacy', 'Prescription drug dispensing, medicine formulation & dosage verification', 'Pill', true),
('dept-lab', 'Diagnostic Pathology & Lab', 'Blood draws, clinical biochemistry, urine analysis & pathology testing', 'FlaskConical', true),
('dept-radiology', 'Radiology & Imaging Center', 'Digital X-Ray, CT Scan, Ultrasound sonography & MRI diagnostic imaging', 'Scan', true),
('dept-cardio', 'Cardiology & Heart Center', 'Electrocardiograms (ECG), Echo, heart rhythm & cardiovascular consultations', 'HeartPulse', true),
('dept-ortho', 'Orthopedics & Bone Health', 'Bone fracture stabilization, joint replacements, arthritis & physiotherapy care', 'Bone', true),
('dept-pedia', 'Pediatrics & Child Care', 'Infant wellness checkups, childhood immunizations & pediatric consultations', 'Baby', true),
('dept-ent', 'ENT (Ear, Nose, Throat)', 'Audiometry hearing tests, sinus treatments & throat endoscopy consultations', 'Ear', true),
('dept-derma', 'Dermatology & Skin Clinic', 'Skin condition treatments, allergy testing & procedural dermatological care', 'Sparkles', true),
('dept-dental', 'Dental Surgery & Oral Health', 'Dental cavity fillings, orthodontics, oral hygiene & tooth restorations', 'Smile', true),
('dept-neuro', 'Neurology & Brain Health', 'EEG testing, migraine treatment, neurological assessments & nerve clinics', 'Brain', true),
('dept-gyn', 'Gynecology & Maternity Care', 'Antenatal wellness checkups, maternal ultrasound & women health services', 'Activity', true),
('dept-ophthal', 'Ophthalmology & Eye Care', 'Refraction vision screening, retina evaluations & glaucoma diagnostics', 'Eye', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Active Hospital Consulting Counters
INSERT INTO public.counters (id, department_id, name, doctor_name, staff_name, status, current_serving, avg_service_minutes) VALUES
('ctr-opd-1', 'dept-opd', 'OPD Counter 1 (General Triage)', 'Dr. Robert Sterling', 'St. Sarah Watson', 'open', 101, 5),
('ctr-opd-2', 'dept-opd', 'OPD Counter 2 (Senior Citizens)', 'Dr. Maya Patel', 'St. David Chen', 'open', 104, 6),
('ctr-emg-1', 'dept-emergency', 'Emergency Trauma Desk 1', 'Dr. James Wilson', 'St. Marcus Lin', 'open', 201, 8),
('ctr-pharma-1', 'dept-pharmacy', 'Pharmacy Express Dispense', 'Dr. Allison Brooks', 'St. Rachel Adams', 'open', 305, 3),
('ctr-lab-1', 'dept-lab', 'Pathology & Blood Collection', 'Dr. Sanjay Mehta', 'St. Kevin Miller', 'open', 402, 4),
('ctr-radio-1', 'dept-radiology', 'X-Ray & MRI Scanning Desk', 'Dr. Priya Nair', 'St. Anita Roy', 'open', 501, 10),
('ctr-cardio-1', 'dept-cardio', 'ECG & Cardio Consultation', 'Dr. Elena Rostova', 'St. Sanjay Kumar', 'open', 601, 9),
('ctr-ortho-1', 'dept-ortho', 'Orthopedic & Fracture Clinic', 'Dr. Rajesh Gupta', 'St. Lucas Gray', 'open', 701, 7),
('ctr-pedia-1', 'dept-pedia', 'Pediatrics Wellness Station', 'Dr. Sunita Deshmukh', 'St. Emily Watson', 'open', 801, 6),
('ctr-ent-1', 'dept-ent', 'ENT Acoustic Examination Desk', 'Dr. Alan Vance', 'St. Chloe Bennett', 'open', 901, 5),
('ctr-derma-1', 'dept-derma', 'Dermatology & Skin Triage', 'Dr. Olivia Thorne', 'St. Noah Scott', 'open', 1001, 6),
('ctr-dental-1', 'dept-dental', 'Dental Operatory Desk 1', 'Dr. Ethan Hunt', 'St. Grace Miller', 'open', 1101, 8),
('ctr-neuro-1', 'dept-neuro', 'Neurology Diagnostic Desk', 'Dr. Carlos Mendez', 'St. Hannah Abbott', 'open', 1201, 10),
('ctr-gyn-1', 'dept-gyn', 'Maternity Care & Obstetric Desk', 'Dr. Fatima Zahra', 'St. Leila Vance', 'open', 1301, 7),
('ctr-ophthal-1', 'dept-ophthal', 'Ophthalmic Refraction Desk', 'Dr. Victor Hugo', 'St. Leo Valdez', 'open', 1401, 5)
ON CONFLICT (id) DO NOTHING;

-- Insert Initial Sample Queue Tokens
INSERT INTO public.tokens (id, counter_id, department_id, user_id, patient_name, patient_email, doctor_name, staff_name, token_number, status, priority, position_in_queue, estimated_wait_minutes, joined_at) VALUES
('tok-demo-101', 'ctr-opd-1', 'dept-opd', 'patient-paras-001', 'Paras Masurkar', 'parasmasurkar10@gmail.com', 'Dr. Robert Sterling', 'St. Sarah Watson', 101, 'serving', 'normal', 1, 0, NOW() - INTERVAL '15 minutes'),
('tok-demo-102', 'ctr-opd-1', 'dept-opd', 'patient-arthur-001', 'Arthur Pendelton', 'arthur.p@example.com', 'Dr. Robert Sterling', 'St. Sarah Watson', 102, 'waiting', 'normal', 1, 5, NOW() - INTERVAL '10 minutes'),
('tok-demo-103', 'ctr-opd-1', 'dept-opd', 'patient-eleanor-002', 'Eleanor Vance', 'eleanor.v@example.com', 'Dr. Robert Sterling', 'St. Sarah Watson', 103, 'waiting', 'normal', 2, 10, NOW() - INTERVAL '5 minutes'),
('tok-demo-104', 'ctr-opd-2', 'dept-opd', 'patient-marcus-003', 'Marcus Aurelius', 'marcus.a@example.com', 'Dr. Maya Patel', 'St. David Chen', 104, 'serving', 'normal', 1, 0, NOW() - INTERVAL '12 minutes'),
('tok-demo-201', 'ctr-emg-1', 'dept-emergency', 'patient-clara-004', 'Clara Oswald', 'clara.o@example.com', 'Dr. James Wilson', 'St. Marcus Lin', 201, 'serving', 'emergency', 1, 0, NOW() - INTERVAL '8 minutes')
ON CONFLICT (id) DO NOTHING;
