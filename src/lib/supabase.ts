import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or localStorage stored credentials
const getStoredCredentials = () => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  
  const localUrl = (localStorage.getItem('leadflow_supabase_url') || '').trim();
  const localKey = (localStorage.getItem('leadflow_supabase_key') || '').trim();

  let url = localUrl || envUrl;
  const key = localKey || envKey;

  // Auto-recovery: If url is missing or doesn't start with http/https, but key is a Supabase JWT with project ref
  if ((!url || (!url.startsWith('http://') && !url.startsWith('https://'))) && key) {
    try {
      const parts = key.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload?.ref) {
          url = `https://${payload.ref}.supabase.co`;
        }
      }
    } catch {
      // ignore
    }
  }

  const isValidUrl = url.startsWith('http://') || url.startsWith('https://');
  const isPlaceholder = url.includes('your-project') || key.includes('your-anon-key');

  return {
    url,
    key,
    isConfigured: Boolean(url && key && isValidUrl && !isPlaceholder),
  };
};

export interface SupabaseConfig {
  url: string;
  key: string;
  isConfigured: boolean;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  return getStoredCredentials();
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('leadflow_supabase_url', url.trim());
  localStorage.setItem('leadflow_supabase_key', key.trim());
  // re-initialize client
  initClient();
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('leadflow_supabase_url');
  localStorage.removeItem('leadflow_supabase_key');
  initClient();
};

let supabaseInstance: SupabaseClient | null = null;

export const initClient = (): SupabaseClient | null => {
  const { url, key, isConfigured } = getStoredCredentials();
  if (isConfigured) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return supabaseInstance;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      supabaseInstance = null;
      return null;
    }
  }
  supabaseInstance = null;
  return null;
};

// Initialize on load
initClient();

export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseInstance) {
    initClient();
  }
  return supabaseInstance;
};

// SQL Schema for Supabase Setup with RLS
export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- LeadFlow CRM - Complete Supabase Database Schema & RLS
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query)
-- ========================================================

-- 1. Enable UUID Extension & pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Profiles (Users) Table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'telecaller')),
  phone TEXT,
  mobile TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Lead Statuses Master (All Standard Dispositions)
CREATE TABLE IF NOT EXISTS public.lead_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#64748b',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  alt_mobile TEXT,
  city TEXT,
  state TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  product TEXT,
  amount NUMERIC DEFAULT 0,
  source TEXT DEFAULT 'Excel Import',
  status TEXT NOT NULL DEFAULT 'Untouched',
  status_id UUID REFERENCES public.lead_statuses(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  remark TEXT,
  followup_date TIMESTAMPTZ,
  callback_date TIMESTAMPTZ,
  order_amount NUMERIC,
  order_product TEXT,
  order_quantity INT,
  payment_status TEXT,
  assigned_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  mobile_unlock_count INT DEFAULT 0,
  mobile_unlocked_at TIMESTAMPTZ,
  mobile_unlocked_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Lead Activities (History Audit Trail)
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  status TEXT NOT NULL,
  remark TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Lead Assignments Log
CREATE TABLE IF NOT EXISTS public.lead_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  previous_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Followups Table
CREATE TABLE IF NOT EXISTS public.followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followup_type TEXT NOT NULL CHECK (followup_type IN ('Follow-up', 'Call Back')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN TRUE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND (is_active = true OR active = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Departments RLS
CREATE POLICY "Admins full access on departments" ON public.departments
  FOR ALL USING (public.is_admin() OR auth.uid() IS NULL);
CREATE POLICY "Users can view active departments" ON public.departments
  FOR SELECT USING (true);

-- Lead Statuses RLS
CREATE POLICY "Admins full access on lead_statuses" ON public.lead_statuses
  FOR ALL USING (public.is_admin() OR auth.uid() IS NULL);
CREATE POLICY "Users can view active lead_statuses" ON public.lead_statuses
  FOR SELECT USING (true);

-- Profiles RLS
CREATE POLICY "Admins full access on profiles" ON public.profiles
  FOR ALL USING (public.is_admin() OR auth.uid() IS NULL);
CREATE POLICY "Users can view active profiles" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Leads RLS: Admin full access; Telecaller can ONLY view & update assigned leads!
CREATE POLICY "Admins full access on leads" ON public.leads
  FOR ALL USING (public.is_admin() OR auth.uid() IS NULL);

CREATE POLICY "Telecallers can view only assigned leads" ON public.leads
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Telecallers can update only assigned leads" ON public.leads
  FOR UPDATE USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Lead Activities RLS
CREATE POLICY "Admins full access on lead_activities" ON public.lead_activities
  FOR ALL USING (public.is_admin() OR auth.uid() IS NULL);

CREATE POLICY "Telecallers can view activities for assigned leads" ON public.lead_activities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_activities.lead_id AND leads.assigned_to = auth.uid())
  );

CREATE POLICY "Telecallers can insert activities for assigned leads" ON public.lead_activities
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_activities.lead_id AND leads.assigned_to = auth.uid())
  );

-- Followups RLS
CREATE POLICY "Admins full access on followups" ON public.followups
  FOR ALL USING (public.is_admin() OR auth.uid() IS NULL);

CREATE POLICY "Telecallers access own followups" ON public.followups
  FOR ALL USING (user_id = auth.uid());

-- Lead Assignments Log RLS
CREATE POLICY "Admins access lead_assignments" ON public.lead_assignments
  FOR ALL USING (public.is_admin() OR auth.uid() IS NULL);

-- Seed All 18 Standard Statuses with valid PostgreSQL UUIDs
INSERT INTO public.lead_statuses (id, name, color, display_order)
VALUES
  ('b1000000-0000-4000-8000-000000000001', 'Untouched', '#64748b', 1),
  ('b1000000-0000-4000-8000-000000000002', 'Contacted', '#0284c7', 2),
  ('b1000000-0000-4000-8000-000000000003', 'Follow-up', '#f59e0b', 3),
  ('b1000000-0000-4000-8000-000000000004', 'Call Back', '#d97706', 4),
  ('b1000000-0000-4000-8000-000000000005', 'Interested', '#8b5cf6', 5),
  ('b1000000-0000-4000-8000-000000000006', 'Hot Lead', '#ef4444', 6),
  ('b1000000-0000-4000-8000-000000000007', 'Order Placed', '#10b981', 7),
  ('b1000000-0000-4000-8000-000000000008', 'Payment Pending', '#eab308', 8),
  ('b1000000-0000-4000-8000-000000000009', 'Money Problem', '#f97316', 9),
  ('b1000000-0000-4000-8000-000000000010', 'Thinking/Discussing', '#6366f1', 10),
  ('b1000000-0000-4000-8000-000000000011', 'No Answer', '#94a3b8', 11),
  ('b1000000-0000-4000-8000-000000000012', 'Busy', '#a8a29e', 12),
  ('b1000000-0000-4000-8000-000000000013', 'Switch Off/Unreachable', '#78716c', 13),
  ('b1000000-0000-4000-8000-000000000014', 'Not Interested', '#6b7280', 14),
  ('b1000000-0000-4000-8000-000000000015', 'Wrong Number', '#dc2626', 15),
  ('b1000000-0000-4000-8000-000000000016', 'Duplicate', '#b91c1c', 16),
  ('b1000000-0000-4000-8000-000000000017', 'Do Not Call', '#991b1b', 17),
  ('b1000000-0000-4000-8000-000000000018', 'Converted/Completed', '#059669', 18)
ON CONFLICT (name) DO NOTHING;

-- Seed Standard Departments with deterministic UUIDs
INSERT INTO public.departments (id, name, code, description)
VALUES
  ('d1000000-0000-4000-8000-000000000001', 'Home Loans', 'HL', 'Mortgages and home refinance'),
  ('d1000000-0000-4000-8000-000000000002', 'Health Insurance', 'INS', 'Comprehensive medical & term policies'),
  ('d1000000-0000-4000-8000-000000000003', 'Credit Cards', 'CC', 'Premium & cashback credit solutions'),
  ('d1000000-0000-4000-8000-000000000004', 'Personal Loans', 'PL', 'Instant unsecured personal credit')
ON CONFLICT (code) DO NOTHING;

-- ========================================================
-- Seed Pre-configured User Accounts (Auth & Profiles)
-- ========================================================
DO $$
DECLARE
  superadmin_id UUID := 'a1000000-0000-4000-8000-000000000000';
  admin_id      UUID := 'a1000000-0000-4000-8000-000000000001';
  manoj_id      UUID := 'a1000000-0000-4000-8000-000000000002';
  suraj_id      UUID := 'a1000000-0000-4000-8000-000000000003';
  jeetu_id      UUID := 'a1000000-0000-4000-8000-000000000004';
BEGIN
  -- 1. Super Administrator (superadmin@leadflow.com / superadmin123)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@leadflow.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      superadmin_id,
      'authenticated',
      'authenticated',
      'superadmin@leadflow.com',
      crypt('superadmin123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super Administrator","username":"superadmin","role":"admin"}'::jsonb,
      NOW(),
      NOW()
    );
  END IF;

  -- 2. Administrator (admin@leadflow.com / admin123)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@leadflow.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      'admin@leadflow.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrator","username":"admin","role":"admin"}'::jsonb,
      NOW(),
      NOW()
    );
  END IF;

  -- 3. Manoj (manoj@leadflow.com / manoj123)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manoj@leadflow.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      manoj_id,
      'authenticated',
      'authenticated',
      'manoj@leadflow.com',
      crypt('manoj123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Manoj","username":"manoj","role":"telecaller"}'::jsonb,
      NOW(),
      NOW()
    );
  END IF;

  -- 4. Suraj (suraj@leadflow.com / suraj123)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'suraj@leadflow.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      suraj_id,
      'authenticated',
      'authenticated',
      'suraj@leadflow.com',
      crypt('suraj123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Suraj","username":"suraj","role":"telecaller"}'::jsonb,
      NOW(),
      NOW()
    );
  END IF;

  -- 5. Jeetu (jeetu@leadflow.com / jeetu123)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'jeetu@leadflow.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      jeetu_id,
      'authenticated',
      'authenticated',
      'jeetu@leadflow.com',
      crypt('jeetu123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Jeetu","username":"jeetu","role":"telecaller"}'::jsonb,
      NOW(),
      NOW()
    );
  END IF;

  -- Profiles Upsert
  INSERT INTO public.profiles (id, email, full_name, username, role, phone, is_active, active)
  VALUES
    (superadmin_id, 'superadmin@leadflow.com', 'Super Administrator', 'superadmin', 'admin', '+91 9876543200', true, true),
    (admin_id,      'admin@leadflow.com',      'Administrator',       'admin',      'admin', '+91 9876543201', true, true),
    (manoj_id,      'manoj@leadflow.com',      'Manoj',               'manoj',      'telecaller', '+91 9876543202', true, true),
    (suraj_id,      'suraj@leadflow.com',      'Suraj',               'suraj',      'telecaller', '+91 9876543203', true, true),
    (jeetu_id,      'jeetu@leadflow.com',      'Jeetu',               'jeetu',      'telecaller', '+91 9876543204', true, true)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    is_active = EXCLUDED.is_active,
    active = EXCLUDED.active;
END $$;
`;
