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

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND (is_active = true OR active = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Departments RLS
CREATE POLICY "Admins full access on departments" ON public.departments
  FOR ALL USING (public.is_admin());
CREATE POLICY "Telecallers can view active departments" ON public.departments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Lead Statuses RLS
CREATE POLICY "Admins full access on lead_statuses" ON public.lead_statuses
  FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view active lead_statuses" ON public.lead_statuses
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Profiles RLS
CREATE POLICY "Admins full access on profiles" ON public.profiles
  FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view active profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Leads RLS: Admin full access; Telecaller can ONLY view & update assigned leads!
CREATE POLICY "Admins full access on leads" ON public.leads
  FOR ALL USING (public.is_admin());

CREATE POLICY "Telecallers can view only assigned leads" ON public.leads
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Telecallers can update only assigned leads" ON public.leads
  FOR UPDATE USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Lead Activities RLS
CREATE POLICY "Admins full access on lead_activities" ON public.lead_activities
  FOR ALL USING (public.is_admin());

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
  FOR ALL USING (public.is_admin());

CREATE POLICY "Telecallers access own followups" ON public.followups
  FOR ALL USING (user_id = auth.uid());

-- Lead Assignments Log RLS
CREATE POLICY "Admins access lead_assignments" ON public.lead_assignments
  FOR ALL USING (public.is_admin());

-- Seed All 18 Standard Statuses
INSERT INTO public.lead_statuses (name, color, display_order)
VALUES
  ('Untouched', '#64748b', 1),
  ('Contacted', '#0284c7', 2),
  ('Follow-up', '#f59e0b', 3),
  ('Call Back', '#d97706', 4),
  ('Interested', '#8b5cf6', 5),
  ('Hot Lead', '#ef4444', 6),
  ('Order Placed', '#10b981', 7),
  ('Payment Pending', '#eab308', 8),
  ('Money Problem', '#f97316', 9),
  ('Thinking/Discussing', '#6366f1', 10),
  ('No Answer', '#94a3b8', 11),
  ('Busy', '#a8a29e', 12),
  ('Switch Off/Unreachable', '#78716c', 13),
  ('Not Interested', '#6b7280', 14),
  ('Wrong Number', '#dc2626', 15),
  ('Duplicate', '#b91c1c', 16),
  ('Do Not Call', '#991b1b', 17),
  ('Converted/Completed', '#059669', 18)
ON CONFLICT (name) DO NOTHING;
`;
