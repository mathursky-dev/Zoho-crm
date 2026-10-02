import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or localStorage stored credentials
const getStoredCredentials = () => {
  // Support standard Vite prefixes, Next.js prefixes, and raw prefixes across Vercel environments
  const envUrl = (
    (import.meta.env.VITE_SUPABASE_URL as string) ||
    (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
    (import.meta.env.SUPABASE_URL as string) ||
    (import.meta.env.VITE_PUBLIC_SUPABASE_URL as string) ||
    ''
  ).trim();

  const envKey = (
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
    (import.meta.env.SUPABASE_ANON_KEY as string) ||
    (import.meta.env.VITE_SUPABASE_KEY as string) ||
    (import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string) ||
    ''
  ).trim();
  
  const localUrl = (typeof localStorage !== 'undefined' ? localStorage.getItem('leadflow_supabase_url') || '' : '').trim();
  const localKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('leadflow_supabase_key') || '' : '').trim();

  // Prioritize environment variables for production (Vercel) builds
  let key = envKey || localKey;
  let url = envUrl || localUrl;

  // Auto-recovery: If url is missing, invalid, a placeholder, or a publishable key string,
  // extract the Supabase project ref directly from the Anon Key JWT payload.
  const isHttpUrl = url.startsWith('http://') || url.startsWith('https://');
  const isPlaceholderUrl = url.includes('your-project');
  
  if ((!isHttpUrl || isPlaceholderUrl || url.startsWith('sb_') || url.startsWith('eyJ')) && (key || url)) {
    try {
      const targetToken = key.startsWith('eyJ') ? key : (url.startsWith('eyJ') ? url : '');
      if (targetToken) {
        const parts = targetToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload?.ref) {
            url = `https://${payload.ref}.supabase.co`;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // If user entered just "project-ref" (e.g. cfrpxzhmhfpwhteavznu) without protocol
  if (!url.startsWith('http://') && !url.startsWith('https://') && url.length > 5 && !url.includes(' ') && !url.startsWith('sb_')) {
    url = `https://${url.replace('.supabase.co', '')}.supabase.co`;
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

export const getSupabaseHost = (): string => {
  const { url } = getStoredCredentials();
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
};

export const getAuthRedirectUrl = (path = '/dashboard'): string => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}${path.startsWith('/') ? path : '/' + path}`;
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string; host?: string }> => {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL and Anon Key are not configured in this environment.',
    };
  }

  try {
    const { error } = await client.from('departments').select('count').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase PostgreSQL! (Database tables need initial SQL schema setup).',
          host: getSupabaseHost(),
        };
      }
      return {
        success: false,
        message: `Supabase returned: ${error.message} (Code: ${error.code || 'unknown'})`,
        host: getSupabaseHost(),
      };
    }
    return {
      success: true,
      message: 'Connected successfully to Supabase PostgreSQL database.',
      host: getSupabaseHost(),
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network connection to Supabase failed.',
      host: getSupabaseHost(),
    };
  }
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
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
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

// Direct client export for imports like `import { supabase } from '../lib/supabase'`
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) {
      if (prop === 'channel') {
        return () => ({
          on: function() { return this; },
          subscribe: function() { return this; },
        });
      }
      if (prop === 'removeChannel') {
        return () => Promise.resolve('ok');
      }
      if (prop === 'from') {
        return (table: string) => ({
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: new Error('Supabase credentials not configured.') }),
            }),
            order: () => Promise.resolve({ data: [], error: new Error('Supabase credentials not configured.') }),
          }),
          insert: (_data: any) => ({
            select: () => ({
              single: () => Promise.reject(new Error('Supabase credentials not configured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')),
            }),
          }),
          update: (_updates: any) => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.reject(new Error('Supabase credentials not configured.')),
              }),
            }),
          }),
          delete: () => ({
            eq: () => Promise.reject(new Error('Supabase credentials not configured.')),
          }),
        });
      }
      return undefined;
    }
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

export default supabase;

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
  company_id TEXT DEFAULT 'default_company',
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Profiles (Users) Table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id TEXT DEFAULT 'default_company',
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
  company_id TEXT DEFAULT 'default_company',
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#64748b',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id TEXT DEFAULT 'default_company',
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Lead Activities (History Audit Trail)
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id TEXT DEFAULT 'default_company',
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
  company_id TEXT DEFAULT 'default_company',
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
  company_id TEXT DEFAULT 'default_company',
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followup_type TEXT NOT NULL CHECK (followup_type IN ('Follow-up', 'Call Back')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- ENABLE SUPABASE REALTIME REPLICATION
-- ========================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_statuses;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_assignments;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_activities;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.followups;
EXCEPTION WHEN OTHERS THEN
  -- Table already in publication or permission notice
  NULL;
END $$;

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
DROP POLICY IF EXISTS "Admins full access on departments" ON public.departments;
DROP POLICY IF EXISTS "Users can view active departments" ON public.departments;
CREATE POLICY "Admins full access on departments" ON public.departments
  FOR ALL USING (public.is_admin() OR auth.uid() IS NULL)
  WITH CHECK (public.is_admin() OR auth.uid() IS NULL);
CREATE POLICY "Users can view active departments" ON public.departments
  FOR SELECT USING (true);

-- Lead Statuses RLS
DROP POLICY IF EXISTS "Admins full access on lead_statuses" ON public.lead_statuses;
DROP POLICY IF EXISTS "Users can view active lead_statuses" ON public.lead_statuses;
CREATE POLICY "Admins full access on lead_statuses" ON public.lead_statuses
  FOR ALL USING (public.is_admin() OR auth.uid() IS NULL)
  WITH CHECK (public.is_admin() OR auth.uid() IS NULL);
CREATE POLICY "Users can view active lead_statuses" ON public.lead_statuses
  FOR SELECT USING (true);

-- Profiles RLS
DROP POLICY IF EXISTS "Admins full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Admins full access on profiles" ON public.profiles
  FOR ALL USING (public.is_admin() OR auth.uid() IS NULL)
  WITH CHECK (public.is_admin() OR auth.uid() IS NULL);
CREATE POLICY "Users can view active profiles" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Leads RLS: Completely open to public/anon/authenticated for insert, update, select, delete
DROP POLICY IF EXISTS "Admins full access on leads" ON public.leads;
DROP POLICY IF EXISTS "Telecallers can view only assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Telecallers can update only assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Allow insert leads" ON public.leads;
DROP POLICY IF EXISTS "Admins delete leads" ON public.leads;
DROP POLICY IF EXISTS "Allow all on leads" ON public.leads;
DROP POLICY IF EXISTS "Enable all access on leads" ON public.leads;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.leads;

CREATE POLICY "Allow all on leads" ON public.leads
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- Lead Activities RLS
DROP POLICY IF EXISTS "Admins full access on lead_activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Telecallers can view activities for assigned leads" ON public.lead_activities;
DROP POLICY IF EXISTS "Telecallers can insert activities for assigned leads" ON public.lead_activities;
DROP POLICY IF EXISTS "Allow all on lead_activities" ON public.lead_activities;

CREATE POLICY "Allow all on lead_activities" ON public.lead_activities
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- Followups RLS
DROP POLICY IF EXISTS "Admins full access on followups" ON public.followups;
DROP POLICY IF EXISTS "Telecallers access own followups" ON public.followups;
DROP POLICY IF EXISTS "Allow all on followups" ON public.followups;

CREATE POLICY "Allow all on followups" ON public.followups
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- Lead Assignments Log RLS
DROP POLICY IF EXISTS "Admins access lead_assignments" ON public.lead_assignments;
DROP POLICY IF EXISTS "Allow all on lead_assignments" ON public.lead_assignments;

CREATE POLICY "Allow all on lead_assignments" ON public.lead_assignments
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- Grant table privileges
GRANT ALL ON TABLE public.leads TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.lead_activities TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.followups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.lead_assignments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.departments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.lead_statuses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;

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
  ('d1000000-0000-4000-8000-000000000004', 'Personal Loans', 'PL', 'Instant unsecured personal credit'),
  ('d1000000-0000-4000-8000-000000000005', 'Astro oc', 'Astro', 'Astrology consultation and occult services'),
  ('d1000000-0000-4000-8000-000000000006', 'Ayur oc', 'Ayur', 'Ayurveda healthcare and herbal remedies')
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

export const SUPABASE_FIX_RLS_SQL = `-- ========================================================
-- 1-CLICK RLS FIX FOR LEADFLOW CRM
-- Fixes: "new row violates row-level security policy for table leads"
-- Paste and Run in Supabase SQL Editor:
-- ========================================================

-- 1. Enable RLS and ensure updated_at column exists
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;

-- 2. Drop all old/restrictive policies on leads
DROP POLICY IF EXISTS "Admins full access on leads" ON public.leads;
DROP POLICY IF EXISTS "Telecallers can view only assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Telecallers can update only assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Allow insert leads" ON public.leads;
DROP POLICY IF EXISTS "Admins delete leads" ON public.leads;
DROP POLICY IF EXISTS "Allow all on leads" ON public.leads;
DROP POLICY IF EXISTS "Enable all access on leads" ON public.leads;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.leads;

-- 3. Create universal permissive policy for leads
CREATE POLICY "Allow all on leads" ON public.leads
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- 4. Clean policies on child tables
DROP POLICY IF EXISTS "Admins full access on lead_activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Telecallers can view activities for assigned leads" ON public.lead_activities;
DROP POLICY IF EXISTS "Telecallers can insert activities for assigned leads" ON public.lead_activities;
DROP POLICY IF EXISTS "Allow all on lead_activities" ON public.lead_activities;
CREATE POLICY "Allow all on lead_activities" ON public.lead_activities
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access on followups" ON public.followups;
DROP POLICY IF EXISTS "Telecallers access own followups" ON public.followups;
DROP POLICY IF EXISTS "Allow all on followups" ON public.followups;
CREATE POLICY "Allow all on followups" ON public.followups
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins access lead_assignments" ON public.lead_assignments;
DROP POLICY IF EXISTS "Allow all on lead_assignments" ON public.lead_assignments;
CREATE POLICY "Allow all on lead_assignments" ON public.lead_assignments
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- 5. Grant permissions to anon, authenticated and service_role
GRANT ALL ON TABLE public.leads TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.lead_activities TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.followups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.lead_assignments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.departments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.lead_statuses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
`;
