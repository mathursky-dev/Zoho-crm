import {
  Department,
  Lead,
  LeadActivity,
  LeadAssignment,
  LeadStatus,
  Profile,
  StandardLeadStatus,
  Followup
} from '../types/crm';
import { getSupabase, getSupabaseConfig } from './supabase';
import * as XLSX from 'xlsx';

// Initial Seed Data
const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Home Loans', code: 'HL', description: 'Mortgages and home refinance', is_active: true, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'dept-2', name: 'Health Insurance', code: 'INS', description: 'Comprehensive medical & term policies', is_active: true, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'dept-3', name: 'Credit Cards', code: 'CC', description: 'Premium & cashback credit solutions', is_active: true, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'dept-4', name: 'Personal Loans', code: 'PL', description: 'Instant unsecured personal credit', is_active: true, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
];

const DEFAULT_USERS: (Profile & { password?: string })[] = [
  {
    id: 'user-admin',
    email: 'admin@leadflow.com',
    full_name: 'Sarah Jenkins',
    role: 'admin',
    department_id: 'dept-1',
    department_name: 'Home Loans',
    is_active: true,
    phone: '+1 555-0100',
    password: 'admin123',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'user-alex',
    email: 'alex@leadflow.com',
    full_name: 'Alex Rivera',
    role: 'telecaller',
    department_id: 'dept-1',
    department_name: 'Home Loans',
    is_active: true,
    phone: '+1 555-0101',
    password: 'alex123',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'user-priya',
    email: 'priya@leadflow.com',
    full_name: 'Priya Sharma',
    role: 'telecaller',
    department_id: 'dept-2',
    department_name: 'Health Insurance',
    is_active: true,
    phone: '+1 555-0102',
    password: 'priya123',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'user-marcus',
    email: 'marcus@leadflow.com',
    full_name: 'Marcus Vance',
    role: 'telecaller',
    department_id: 'dept-3',
    department_name: 'Credit Cards',
    is_active: true,
    phone: '+1 555-0103',
    password: 'marcus123',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

const DEFAULT_STATUSES: LeadStatus[] = [
  { id: 'st-1', name: 'Untouched', color: '#64748b', is_active: true, display_order: 1, created_at: new Date().toISOString() },
  { id: 'st-2', name: 'Contacted', color: '#0284c7', is_active: true, display_order: 2, created_at: new Date().toISOString() },
  { id: 'st-3', name: 'Follow-up', color: '#f59e0b', is_active: true, display_order: 3, created_at: new Date().toISOString() },
  { id: 'st-4', name: 'Call Back', color: '#d97706', is_active: true, display_order: 4, created_at: new Date().toISOString() },
  { id: 'st-5', name: 'Interested', color: '#8b5cf6', is_active: true, display_order: 5, created_at: new Date().toISOString() },
  { id: 'st-6', name: 'Hot Lead', color: '#ef4444', is_active: true, display_order: 6, created_at: new Date().toISOString() },
  { id: 'st-7', name: 'Order Placed', color: '#10b981', is_active: true, display_order: 7, created_at: new Date().toISOString() },
  { id: 'st-8', name: 'Payment Pending', color: '#eab308', is_active: true, display_order: 8, created_at: new Date().toISOString() },
  { id: 'st-9', name: 'Money Problem', color: '#f97316', is_active: true, display_order: 9, created_at: new Date().toISOString() },
  { id: 'st-10', name: 'No Answer', color: '#94a3b8', is_active: true, display_order: 10, created_at: new Date().toISOString() },
  { id: 'st-11', name: 'Busy', color: '#a8a29e', is_active: true, display_order: 11, created_at: new Date().toISOString() },
  { id: 'st-12', name: 'Not Interested', color: '#6b7280', is_active: true, display_order: 12, created_at: new Date().toISOString() },
  { id: 'st-13', name: 'Wrong Number', color: '#dc2626', is_active: true, display_order: 13, created_at: new Date().toISOString() },
  { id: 'st-14', name: 'Converted', color: '#059669', is_active: true, display_order: 14, created_at: new Date().toISOString() },
];

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000);
const yesterdayStr = yesterday.toISOString().split('T')[0];

const DEFAULT_LEADS: Lead[] = [
  {
    id: 'lead-1',
    lead_code: 'LD-1001',
    customer_name: 'Robert Miller',
    mobile: '9876543210',
    alt_mobile: '9876543211',
    city: 'New York',
    state: 'NY',
    department_id: 'dept-1',
    department_name: 'Home Loans',
    product: 'Fixed 30Y Mortgage',
    amount: 350000,
    source: 'Website Landing Page',
    status: 'Untouched',
    assigned_to: 'user-alex',
    assigned_to_name: 'Alex Rivera',
    remark: 'Inquired about first-time home buyer terms.',
    followup_date: null,
    callback_date: null,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    assigned_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    last_activity_at: null,
  },
  {
    id: 'lead-2',
    lead_code: 'LD-1002',
    customer_name: 'Emily Davis',
    mobile: '9123456789',
    city: 'Austin',
    state: 'TX',
    department_id: 'dept-1',
    department_name: 'Home Loans',
    product: 'Home Refinance',
    amount: 280000,
    source: 'Google Ads',
    status: 'Follow-up',
    assigned_to: 'user-alex',
    assigned_to_name: 'Alex Rivera',
    remark: 'Requested rate comparison chart. Call back afternoon.',
    followup_date: `${todayStr}T14:30:00.000Z`,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    assigned_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    last_activity_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'lead-3',
    lead_code: 'LD-1003',
    customer_name: 'Michael Chen',
    mobile: '9789012345',
    city: 'San Francisco',
    state: 'CA',
    department_id: 'dept-1',
    department_name: 'Home Loans',
    product: 'Jumbo Loan',
    amount: 850000,
    source: 'Referral',
    status: 'Hot Lead',
    assigned_to: 'user-alex',
    assigned_to_name: 'Alex Rivera',
    remark: 'Very keen to close before month end. Documents submitted.',
    followup_date: `${todayStr}T11:00:00.000Z`,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    assigned_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    last_activity_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'lead-4',
    lead_code: 'LD-1004',
    customer_name: 'Sarah Connor',
    mobile: '9456781230',
    city: 'Seattle',
    state: 'WA',
    department_id: 'dept-1',
    department_name: 'Home Loans',
    product: 'Fixed 15Y Mortgage',
    amount: 420000,
    source: 'Excel Import',
    status: 'Call Back',
    assigned_to: 'user-alex',
    assigned_to_name: 'Alex Rivera',
    remark: 'Driving at the moment, asked to ring back at 5 PM.',
    callback_date: `${todayStr}T17:00:00.000Z`,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    assigned_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    last_activity_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'lead-5',
    lead_code: 'LD-1005',
    customer_name: 'David Wilson',
    mobile: '9654321870',
    city: 'Chicago',
    state: 'IL',
    department_id: 'dept-1',
    department_name: 'Home Loans',
    product: 'Home Refinance',
    amount: 195000,
    source: 'Website Landing Page',
    status: 'Follow-up',
    assigned_to: 'user-alex',
    assigned_to_name: 'Alex Rivera',
    remark: 'Need to review bank statement.',
    followup_date: `${yesterdayStr}T10:00:00.000Z`, // Overdue!
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    assigned_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_activity_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'lead-6',
    lead_code: 'LD-1006',
    customer_name: 'Jessica Taylor',
    mobile: '9321456780',
    city: 'Denver',
    state: 'CO',
    department_id: 'dept-1',
    department_name: 'Home Loans',
    product: 'Home Loan Pre-approval',
    amount: 310000,
    source: 'Facebook Ad',
    status: 'Order Placed',
    assigned_to: 'user-alex',
    assigned_to_name: 'Alex Rivera',
    remark: 'Sanction letter issued. Application fee paid.',
    order_amount: 310000,
    order_product: 'Home Loan Pre-approval',
    order_quantity: 1,
    payment_status: 'Paid',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    assigned_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    last_activity_at: new Date().toISOString(),
  },
  {
    id: 'lead-7',
    lead_code: 'LD-1007',
    customer_name: 'Carlos Ruiz',
    mobile: '9812345678',
    city: 'Miami',
    state: 'FL',
    department_id: 'dept-1',
    department_name: 'Home Loans',
    product: 'Fixed 30Y Mortgage',
    amount: 260000,
    source: 'Referral',
    status: 'Money Problem',
    assigned_to: 'user-alex',
    assigned_to_name: 'Alex Rivera',
    remark: 'Down payment shortfall, exploring options with parents.',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    assigned_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    last_activity_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'lead-8',
    lead_code: 'LD-1008',
    customer_name: 'Ananya Gupta',
    mobile: '9901234567',
    city: 'Boston',
    state: 'MA',
    department_id: 'dept-2',
    department_name: 'Health Insurance',
    product: 'Family Floater Plan',
    amount: 25000,
    source: 'Website Landing Page',
    status: 'Untouched',
    assigned_to: 'user-priya',
    assigned_to_name: 'Priya Sharma',
    remark: 'Looking for cashless hospital coverage in Massachusetts.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    assigned_at: new Date().toISOString(),
    last_activity_at: null,
  },
  {
    id: 'lead-9',
    lead_code: 'LD-1009',
    customer_name: 'Brian O\'Connor',
    mobile: '9834567890',
    city: 'Dallas',
    state: 'TX',
    department_id: 'dept-2',
    department_name: 'Health Insurance',
    product: 'Critical Illness Rider',
    amount: 18000,
    source: 'Google Ads',
    status: 'Interested',
    assigned_to: 'user-priya',
    assigned_to_name: 'Priya Sharma',
    remark: 'Sent plan brochure on email. Customer satisfied with premium.',
    followup_date: `${todayStr}T16:00:00.000Z`,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    assigned_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    last_activity_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'lead-10',
    lead_code: 'LD-1010',
    customer_name: 'Anita Roy',
    mobile: '9123894567',
    city: 'Atlanta',
    state: 'GA',
    department_id: 'dept-2',
    department_name: 'Health Insurance',
    product: 'Senior Citizen Health Cover',
    amount: 32000,
    source: 'Excel Import',
    status: 'Order Placed',
    assigned_to: 'user-priya',
    assigned_to_name: 'Priya Sharma',
    remark: 'Policy issued successfully. Payment received via online portal.',
    order_amount: 32000,
    order_product: 'Senior Citizen Health Cover',
    order_quantity: 1,
    payment_status: 'Paid',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    assigned_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    last_activity_at: new Date().toISOString(),
  },
  {
    id: 'lead-11',
    lead_code: 'LD-1011',
    customer_name: 'Kevin Hart',
    mobile: '9456123789',
    city: 'Phoenix',
    state: 'AZ',
    department_id: 'dept-3',
    department_name: 'Credit Cards',
    product: 'Platinum Travel Card',
    amount: 5000,
    source: 'Website Landing Page',
    status: 'Untouched',
    assigned_to: 'user-marcus',
    assigned_to_name: 'Marcus Vance',
    remark: 'Wants zero foreign transaction fee card.',
    created_at: new Date().toISOString(),
    assigned_at: new Date().toISOString(),
    last_activity_at: null,
  },
  {
    id: 'lead-12',
    lead_code: 'LD-1012',
    customer_name: 'Samantha Lee',
    mobile: '9678901234',
    city: 'Portland',
    state: 'OR',
    department_id: 'dept-1',
    department_name: 'Home Loans',
    product: 'First Home Buyer Loan',
    amount: 275000,
    source: 'Excel Import',
    status: 'Untouched',
    assigned_to: null, // UNASSIGNED FOR ADMIN TESTING
    assigned_to_name: null,
    remark: 'Direct import from web registration list.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    assigned_at: null,
    last_activity_at: null,
  },
  {
    id: 'lead-13',
    lead_code: 'LD-1013',
    customer_name: 'George Washington',
    mobile: '9567890123',
    city: 'Philadelphia',
    state: 'PA',
    department_id: 'dept-1',
    department_name: 'Home Loans',
    product: 'Refinance Plus',
    amount: 340000,
    source: 'Excel Import',
    status: 'Untouched',
    assigned_to: null, // UNASSIGNED
    assigned_to_name: null,
    remark: 'Imported batch. Needs phone verification.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    assigned_at: null,
    last_activity_at: null,
  },
  {
    id: 'lead-14',
    lead_code: 'LD-1014',
    customer_name: 'Pooja Patel',
    mobile: '9845123456',
    city: 'Houston',
    state: 'TX',
    department_id: 'dept-2',
    department_name: 'Health Insurance',
    product: 'Individual Mediclaim',
    amount: 15000,
    source: 'Excel Import',
    status: 'Untouched',
    assigned_to: null, // UNASSIGNED
    assigned_to_name: null,
    remark: 'Corporate employee seeking top-up cover.',
    created_at: new Date().toISOString(),
    assigned_at: null,
    last_activity_at: null,
  },
  {
    id: 'lead-15',
    lead_code: 'LD-1015',
    customer_name: 'Vikram Seth',
    mobile: '9712348901',
    city: 'San Jose',
    state: 'CA',
    department_id: 'dept-3',
    department_name: 'Credit Cards',
    product: 'Cashback Infinite Card',
    amount: 0,
    source: 'Excel Import',
    status: 'Untouched',
    assigned_to: null, // UNASSIGNED
    assigned_to_name: null,
    remark: 'Qualified applicant with 780+ credit score.',
    created_at: new Date().toISOString(),
    assigned_at: null,
    last_activity_at: null,
  }
];

const DEFAULT_ACTIVITIES: LeadActivity[] = [
  {
    id: 'act-1',
    lead_id: 'lead-2',
    user_id: 'user-alex',
    user_name: 'Alex Rivera',
    status: 'Follow-up',
    remark: 'Discussed 30yr vs 15yr rates. Customer asked for formal quote.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'act-2',
    lead_id: 'lead-3',
    user_id: 'user-alex',
    user_name: 'Alex Rivera',
    status: 'Contacted',
    remark: 'Initial contact made. Verified property details and loan eligibility.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'act-3',
    lead_id: 'lead-3',
    user_id: 'user-alex',
    user_name: 'Alex Rivera',
    status: 'Hot Lead',
    remark: 'Customer satisfied with 6.25% APR rate lock. Closing expedited.',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'act-4',
    lead_id: 'lead-6',
    user_id: 'user-alex',
    user_name: 'Alex Rivera',
    status: 'Order Placed',
    remark: 'Loan approved and accepted. Processing fees settled.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'act-5',
    lead_id: 'lead-9',
    user_id: 'user-priya',
    user_name: 'Priya Sharma',
    status: 'Interested',
    remark: 'Email sent with policy wording and list of network hospitals.',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  }
];

// Helper storage functions
function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`leadflow_${key}`);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(`leadflow_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving leadflow_${key}`, err);
  }
}

export class DatabaseService {
  private static instance: DatabaseService;

  private departments: Department[] = [];
  private users: (Profile & { password?: string })[] = [];
  private statuses: LeadStatus[] = [];
  private leads: Lead[] = [];
  private activities: LeadActivity[] = [];
  private currentUser: Profile | null = null;

  private constructor() {
    this.init();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private init() {
    this.departments = getStorage('departments', DEFAULT_DEPARTMENTS);
    this.users = getStorage('users', DEFAULT_USERS);
    this.statuses = getStorage('statuses', DEFAULT_STATUSES);
    this.leads = getStorage('leads', DEFAULT_LEADS);
    this.activities = getStorage('activities', DEFAULT_ACTIVITIES);

    // Default logged in user: Admin Sarah Jenkins
    const savedUser = getStorage<Profile | null>('current_user', null);
    if (savedUser) {
      this.currentUser = savedUser;
    } else {
      this.currentUser = this.users[0]; // Admin by default for fast preview
      setStorage('current_user', this.currentUser);
    }
  }

  // --- AUTHENTICATION ---
  public getCurrentUser(): Profile {
    if (!this.currentUser) {
      this.currentUser = this.users[0];
      setStorage('current_user', this.currentUser);
    }
    return this.currentUser;
  }

  public async signIn(email: string, pass: string): Promise<{ user?: Profile; error?: string }> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (!error && data.user) {
          // fetch profile
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          if (prof) {
            this.currentUser = prof as Profile;
            setStorage('current_user', this.currentUser);
            return { user: this.currentUser };
          }
        }
      } catch (e) {
        console.warn('Supabase remote sign-in failed, checking local credentials', e);
      }
    }

    // Local authentication check
    const matched = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!matched) {
      return { error: 'Invalid email address.' };
    }
    if (matched.password && matched.password !== pass) {
      return { error: 'Incorrect password.' };
    }
    if (!matched.is_active) {
      return { error: 'Account is deactivated. Please contact your administrator.' };
    }

    this.currentUser = matched;
    setStorage('current_user', this.currentUser);
    return { user: matched };
  }

  public signOut() {
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    this.currentUser = null;
    localStorage.removeItem('leadflow_current_user');
  }

  public switchDemoUser(userId: string): Profile | null {
    const found = this.users.find(u => u.id === userId);
    if (found) {
      this.currentUser = found;
      setStorage('current_user', this.currentUser);
      return found;
    }
    return null;
  }

  // --- DEPARTMENTS MASTER ---
  public getDepartments(includeInactive = false): Department[] {
    if (includeInactive) return [...this.departments];
    return this.departments.filter(d => d.is_active);
  }

  public addDepartment(dept: Omit<Department, 'id' | 'created_at'>): Department {
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...dept,
    };
    this.departments.push(newDept);
    setStorage('departments', this.departments);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('departments').insert([{
        id: newDept.id,
        name: newDept.name,
        code: newDept.code,
        description: newDept.description,
        is_active: newDept.is_active,
      }]).then();
    }
    return newDept;
  }

  public updateDepartment(id: string, updates: Partial<Department>): Department | null {
    const index = this.departments.findIndex(d => d.id === id);
    if (index === -1) return null;
    this.departments[index] = { ...this.departments[index], ...updates };
    setStorage('departments', this.departments);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('departments').update(updates).eq('id', id).then();
    }
    return this.departments[index];
  }

  // --- USER MASTER ---
  public getUsers(includeInactive = false): Profile[] {
    const list = includeInactive ? this.users : this.users.filter(u => u.is_active);
    // Enrich department_name
    return list.map(u => {
      const dept = this.departments.find(d => d.id === u.department_id);
      return {
        ...u,
        department_name: dept ? dept.name : u.department_name,
      };
    });
  }

  public getTelecallersByDepartment(departmentId?: string): Profile[] {
    return this.getUsers(false).filter(u => {
      if (u.role !== 'telecaller') return false;
      if (!departmentId) return true;
      return u.department_id === departmentId;
    });
  }

  public addUser(user: Omit<Profile, 'id' | 'created_at'> & { password?: string }): Profile {
    const newUser: Profile & { password?: string } = {
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...user,
    };
    const dept = this.departments.find(d => d.id === newUser.department_id);
    if (dept) newUser.department_name = dept.name;

    this.users.push(newUser);
    setStorage('users', this.users);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('profiles').insert([{
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        department_id: newUser.department_id,
        phone: newUser.phone,
        is_active: newUser.is_active,
      }]).then();
    }
    return newUser;
  }

  public updateUser(id: string, updates: Partial<Profile & { password?: string }>): Profile | null {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    this.users[index] = { ...this.users[index], ...updates };
    const dept = this.departments.find(d => d.id === this.users[index].department_id);
    if (dept) this.users[index].department_name = dept.name;

    setStorage('users', this.users);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('profiles').update(updates).eq('id', id).then();
    }
    return this.users[index];
  }

  // --- STATUS MASTER ---
  public getStatuses(includeInactive = false): LeadStatus[] {
    const list = includeInactive ? this.statuses : this.statuses.filter(s => s.is_active);
    return list.sort((a, b) => a.display_order - b.display_order);
  }

  public addStatus(status: Omit<LeadStatus, 'id' | 'created_at'>): LeadStatus {
    const newStatus: LeadStatus = {
      id: `st-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...status,
    };
    this.statuses.push(newStatus);
    setStorage('statuses', this.statuses);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('lead_statuses').insert([newStatus]).then();
    }
    return newStatus;
  }

  public updateStatus(id: string, updates: Partial<LeadStatus>): LeadStatus | null {
    const index = this.statuses.findIndex(s => s.id === id);
    if (index === -1) return null;
    this.statuses[index] = { ...this.statuses[index], ...updates };
    setStorage('statuses', this.statuses);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('lead_statuses').update(updates).eq('id', id).then();
    }
    return this.statuses[index];
  }

  // --- LEADS & RLS ENFORCEMENT ---
  /**
   * Returns leads obeying strict RLS:
   * - Admin: views all leads
   * - Telecaller: ONLY views leads where assigned_to === currentUser.id
   */
  public getLeads(filters?: {
    search?: string;
    department_id?: string;
    user_id?: string;
    status?: string;
    product?: string;
    source?: string;
    dateRange?: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';
    startDate?: string;
    endDate?: string;
    onlyUnassigned?: boolean;
  }): Lead[] {
    const user = this.getCurrentUser();
    let result = [...this.leads];

    // STRICT SECURITY / RLS:
    // If current user is a telecaller, NEVER permit access to other users' leads!
    if (user.role === 'telecaller') {
      result = result.filter(lead => lead.assigned_to === user.id);
    }

    if (!filters) {
      return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Search filter: Customer Name, Mobile, Alternate Mobile, Lead ID/Code
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(l =>
        l.customer_name.toLowerCase().includes(q) ||
        l.mobile.includes(q) ||
        (l.alt_mobile && l.alt_mobile.includes(q)) ||
        l.lead_code.toLowerCase().includes(q) ||
        (l.city && l.city.toLowerCase().includes(q))
      );
    }

    // Only unassigned filter (used in manual assignment)
    if (filters.onlyUnassigned) {
      result = result.filter(l => !l.assigned_to);
    }

    // Department filter
    if (filters.department_id) {
      result = result.filter(l => l.department_id === filters.department_id);
    }

    // User filter (only applies to admin)
    if (user.role === 'admin' && filters.user_id) {
      if (filters.user_id === 'unassigned') {
        result = result.filter(l => !l.assigned_to);
      } else {
        result = result.filter(l => l.assigned_to === filters.user_id);
      }
    }

    // Status filter
    if (filters.status) {
      result = result.filter(l => l.status.toLowerCase() === filters.status!.toLowerCase());
    }

    // Product filter
    if (filters.product) {
      result = result.filter(l => l.product.toLowerCase().includes(filters.product!.toLowerCase()));
    }

    // Source filter
    if (filters.source) {
      result = result.filter(l => l.source === filters.source);
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterdayStart = todayStart - 86400000;
      const weekStart = todayStart - 7 * 86400000;
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      result = result.filter(l => {
        const leadTime = new Date(l.created_at).getTime();
        switch (filters.dateRange) {
          case 'today':
            return leadTime >= todayStart;
          case 'yesterday':
            return leadTime >= yesterdayStart && leadTime < todayStart;
          case 'week':
            return leadTime >= weekStart;
          case 'month':
            return leadTime >= monthStart;
          case 'custom':
            if (filters.startDate && filters.endDate) {
              const start = new Date(filters.startDate).getTime();
              const end = new Date(filters.endDate).getTime() + 86400000; // include end of day
              return leadTime >= start && leadTime <= end;
            }
            return true;
          default:
            return true;
        }
      });
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getLeadById(id: string): Lead | null {
    const user = this.getCurrentUser();
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return null;

    // RLS check
    if (user.role === 'telecaller' && lead.assigned_to !== user.id) {
      return null; // Deny access
    }
    return lead;
  }

  // --- MANUAL LEAD ASSIGNMENT & REASSIGNMENT ---
  public assignLeads(leadIds: string[], assignToUserId: string): { successCount: number; message: string } {
    const user = this.getCurrentUser();
    if (user.role !== 'admin') {
      return { successCount: 0, message: 'Unauthorized. Only admins can assign leads.' };
    }

    const targetUser = this.users.find(u => u.id === assignToUserId);
    if (!targetUser) {
      return { successCount: 0, message: 'Assigned user not found or inactive.' };
    }

    let count = 0;
    const now = new Date().toISOString();

    this.leads = this.leads.map(lead => {
      if (leadIds.includes(lead.id)) {
        count++;
        // If it was untouched or unassigned, keep untouched until telecaller interacts
        return {
          ...lead,
          assigned_to: targetUser.id,
          assigned_to_name: targetUser.full_name,
          assigned_at: now,
          status: lead.status === 'Untouched' ? 'Untouched' : lead.status,
        };
      }
      return lead;
    });

    setStorage('leads', this.leads);

    // Record activity / assignment log
    leadIds.forEach(id => {
      const act: LeadActivity = {
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        lead_id: id,
        user_id: user.id,
        user_name: user.full_name,
        status: 'Assigned',
        remark: `Lead assigned to ${targetUser.full_name} (${targetUser.department_name || 'General'}) by Admin`,
        created_at: now,
      };
      this.activities.unshift(act);
    });
    setStorage('activities', this.activities);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('leads').update({
        assigned_to: targetUser.id,
        assigned_at: now,
      }).in('id', leadIds).then();
    }

    return { successCount: count, message: `Successfully assigned ${count} lead(s) to ${targetUser.full_name}.` };
  }

  // --- EXCEL / CSV IMPORT ---
  public importLeads(
    rows: any[],
    departmentId: string,
    columnMap: {
      customer_name: string;
      mobile: string;
      alt_mobile?: string;
      city?: string;
      state?: string;
      product?: string;
      amount?: string;
      source?: string;
      remark?: string;
    }
  ): {
    totalRows: number;
    importedCount: number;
    duplicateMobiles: string[];
    skippedRows: number;
    createdLeads: Lead[];
  } {
    const dept = this.departments.find(d => d.id === departmentId);
    const existingMobiles = new Set(this.leads.map(l => l.mobile.replace(/\D/g, '')));
    const duplicateMobiles: string[] = [];
    const newLeads: Lead[] = [];

    // Find highest current lead number
    let maxNumber = 1000;
    this.leads.forEach(l => {
      const num = parseInt(l.lead_code.replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    });

    rows.forEach(row => {
      const rawMobile = String(row[columnMap.mobile] || '').replace(/\D/g, '').trim();
      const rawName = String(row[columnMap.customer_name] || '').trim();

      if (!rawMobile || !rawName) {
        return; // skip empty required fields
      }

      // Check duplicates
      if (existingMobiles.has(rawMobile)) {
        duplicateMobiles.push(rawMobile);
        return;
      }
      existingMobiles.add(rawMobile);

      maxNumber++;
      const leadCode = `LD-${maxNumber}`;

      const rawAmount = columnMap.amount ? Number(row[columnMap.amount]) || 0 : 0;
      const product = columnMap.product ? String(row[columnMap.product] || dept?.name || 'General Product') : (dept?.name || 'General Product');
      const source = columnMap.source ? String(row[columnMap.source] || 'Excel Import') : 'Excel Import';
      const city = columnMap.city ? String(row[columnMap.city] || '') : '';
      const state = columnMap.state ? String(row[columnMap.state] || '') : '';
      const alt_mobile = columnMap.alt_mobile ? String(row[columnMap.alt_mobile] || '').replace(/\D/g, '') : '';
      const remark = columnMap.remark ? String(row[columnMap.remark] || '') : 'Imported via CSV/Excel';

      const lead: Lead = {
        id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        lead_code: leadCode,
        customer_name: rawName,
        mobile: rawMobile,
        alt_mobile: alt_mobile || undefined,
        city: city || undefined,
        state: state || undefined,
        department_id: departmentId,
        department_name: dept ? dept.name : 'General',
        product,
        amount: rawAmount,
        source,
        status: 'Untouched',
        assigned_to: null, // Imported as Unassigned Leads per specification!
        assigned_to_name: null,
        remark,
        created_at: new Date().toISOString(),
        assigned_at: null,
        last_activity_at: null,
      };

      newLeads.push(lead);
    });

    this.leads = [...newLeads, ...this.leads];
    setStorage('leads', this.leads);

    const supabase = getSupabase();
    if (supabase && newLeads.length > 0) {
      supabase.from('leads').insert(newLeads.map(l => ({
        id: l.id,
        lead_code: l.lead_code,
        customer_name: l.customer_name,
        mobile: l.mobile,
        alt_mobile: l.alt_mobile,
        city: l.city,
        state: l.state,
        department_id: l.department_id,
        product: l.product,
        amount: l.amount,
        source: l.source,
        status: l.status,
        assigned_to: null,
        remark: l.remark,
      }))).then();
    }

    return {
      totalRows: rows.length,
      importedCount: newLeads.length,
      duplicateMobiles,
      skippedRows: rows.length - newLeads.length,
      createdLeads: newLeads,
    };
  }

  // --- LEAD UPDATE & ACTIVITY HISTORY ---
  /**
   * Updates lead and creates an immutable LeadActivity history record!
   * Telecallers can only update leads assigned to them.
   */
  public updateLead(
    leadId: string,
    updates: {
      status: StandardLeadStatus | string;
      remark: string;
      followup_date?: string | null;
      callback_date?: string | null;
      order_amount?: number | null;
      order_product?: string | null;
      order_quantity?: number | null;
      payment_status?: 'Pending' | 'Paid' | 'Partial' | 'COD' | null;
    }
  ): { success: boolean; lead?: Lead; error?: string } {
    const user = this.getCurrentUser();
    const index = this.leads.findIndex(l => l.id === leadId);
    if (index === -1) {
      return { success: false, error: 'Lead not found.' };
    }

    const currentLead = this.leads[index];

    // RLS Enforcement: telecallers can ONLY update their own assigned leads!
    if (user.role === 'telecaller' && currentLead.assigned_to !== user.id) {
      return { success: false, error: 'Unauthorized. You can only update leads assigned to you.' };
    }

    const now = new Date().toISOString();

    const updatedLead: Lead = {
      ...currentLead,
      status: updates.status,
      remark: updates.remark || currentLead.remark,
      followup_date: updates.followup_date !== undefined ? updates.followup_date : currentLead.followup_date,
      callback_date: updates.callback_date !== undefined ? updates.callback_date : currentLead.callback_date,
      last_activity_at: now,
      order_amount: updates.order_amount !== undefined ? updates.order_amount : currentLead.order_amount,
      order_product: updates.order_product !== undefined ? updates.order_product : currentLead.order_product,
      order_quantity: updates.order_quantity !== undefined ? updates.order_quantity : currentLead.order_quantity,
      payment_status: updates.payment_status !== undefined ? updates.payment_status : currentLead.payment_status,
    };

    this.leads[index] = updatedLead;
    setStorage('leads', this.leads);

    // IMMUTABLE ACTIVITY HISTORY RECORD
    const newActivity: LeadActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      lead_id: leadId,
      user_id: user.id,
      user_name: user.full_name,
      status: updates.status,
      remark: updates.remark || 'Status updated',
      created_at: now,
    };

    this.activities.unshift(newActivity);
    setStorage('activities', this.activities);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('leads').update({
        status: updatedLead.status,
        remark: updatedLead.remark,
        followup_date: updatedLead.followup_date,
        callback_date: updatedLead.callback_date,
        last_activity_at: updatedLead.last_activity_at,
        order_amount: updatedLead.order_amount,
        order_product: updatedLead.order_product,
        order_quantity: updatedLead.order_quantity,
        payment_status: updatedLead.payment_status,
      }).eq('id', leadId).then();

      supabase.from('lead_activities').insert([{
        id: newActivity.id,
        lead_id: newActivity.lead_id,
        user_id: newActivity.user_id,
        user_name: newActivity.user_name,
        status: newActivity.status,
        remark: newActivity.remark,
      }]).then();
    }

    return { success: true, lead: updatedLead };
  }

  // --- ACTIVITIES ---
  public getLeadActivities(leadId: string): LeadActivity[] {
    const lead = this.getLeadById(leadId);
    if (!lead) return []; // Denied or not found
    return this.activities
      .filter(a => a.lead_id === leadId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // --- FOLLOW-UPS ---
  public getFollowups(filterType?: 'all' | 'today' | 'overdue' | 'callback'): (Followup & { lead?: Lead })[] {
    const user = this.getCurrentUser();
    let leads = this.getLeads(); // already filtered by RLS if telecaller

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    const followups: (Followup & { lead?: Lead })[] = [];

    leads.forEach(lead => {
      if (lead.followup_date) {
        const time = new Date(lead.followup_date).getTime();
        let status: 'Pending' | 'Completed' | 'Overdue' | 'Cancelled' = 'Pending';
        if (lead.status === 'Converted' || lead.status === 'Order Placed') {
          status = 'Completed';
        } else if (time < todayStart) {
          status = 'Overdue';
        }

        followups.push({
          id: `fol-${lead.id}-f`,
          lead_id: lead.id,
          lead_code: lead.lead_code,
          customer_name: lead.customer_name,
          mobile: lead.mobile,
          user_id: lead.assigned_to || '',
          followup_type: 'Follow-up',
          scheduled_at: lead.followup_date,
          status,
          remarks: lead.remark,
          created_at: lead.last_activity_at || lead.created_at,
          lead,
        });
      }

      if (lead.callback_date) {
        const time = new Date(lead.callback_date).getTime();
        let status: 'Pending' | 'Completed' | 'Overdue' | 'Cancelled' = 'Pending';
        if (lead.status === 'Converted' || lead.status === 'Order Placed') {
          status = 'Completed';
        } else if (time < todayStart) {
          status = 'Overdue';
        }

        followups.push({
          id: `fol-${lead.id}-c`,
          lead_id: lead.id,
          lead_code: lead.lead_code,
          customer_name: lead.customer_name,
          mobile: lead.mobile,
          user_id: lead.assigned_to || '',
          followup_type: 'Call Back',
          scheduled_at: lead.callback_date,
          status,
          remarks: lead.remark,
          created_at: lead.last_activity_at || lead.created_at,
          lead,
        });
      }
    });

    if (filterType === 'today') {
      return followups.filter(f => {
        const t = new Date(f.scheduled_at).getTime();
        return t >= todayStart && t < todayEnd;
      });
    }
    if (filterType === 'overdue') {
      return followups.filter(f => f.status === 'Overdue');
    }
    if (filterType === 'callback') {
      return followups.filter(f => f.followup_type === 'Call Back');
    }

    return followups.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }

  // --- TELECALLER METRICS (KPI Cards) ---
  public getTelecallerMetrics(userId?: string) {
    const user = this.getCurrentUser();
    const targetUserId = user.role === 'admin' && userId ? userId : user.id;

    // Filter leads assigned to target telecaller
    const myLeads = this.leads.filter(l => l.assigned_to === targetUserId);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    let totalAssigned = myLeads.length;
    let untouched = 0;
    let contacted = 0;
    let followup = 0;
    let callback = 0;
    let interested = 0;
    let hotLead = 0;
    let orderPlaced = 0;
    let paymentPending = 0;
    let moneyProblem = 0;
    let noAnswer = 0;
    let notInterested = 0;
    let busy = 0;
    let wrongNumber = 0;
    let converted = 0;

    let followupsToday = 0;
    let callbacksToday = 0;
    let overdueFollowups = 0;
    let ordersToday = 0;

    myLeads.forEach(l => {
      // Untouched = assigned lead with no user activity yet (last_activity_at is null or status is Untouched)
      if (!l.last_activity_at || l.status === 'Untouched') {
        untouched++;
      }

      switch (l.status) {
        case 'Contacted': contacted++; break;
        case 'Follow-up': followup++; break;
        case 'Call Back': callback++; break;
        case 'Interested': interested++; break;
        case 'Hot Lead': hotLead++; break;
        case 'Order Placed': orderPlaced++; break;
        case 'Payment Pending': paymentPending++; break;
        case 'Money Problem': moneyProblem++; break;
        case 'No Answer': noAnswer++; break;
        case 'Busy': busy++; break;
        case 'Not Interested': notInterested++; break;
        case 'Wrong Number': wrongNumber++; break;
        case 'Converted': converted++; break;
      }

      // Check today's schedules
      if (l.followup_date) {
        const ft = new Date(l.followup_date).getTime();
        if (ft >= todayStart && ft < todayEnd) followupsToday++;
        if (ft < todayStart && l.status !== 'Order Placed' && l.status !== 'Converted') overdueFollowups++;
      }
      if (l.callback_date) {
        const ct = new Date(l.callback_date).getTime();
        if (ct >= todayStart && ct < todayEnd) callbacksToday++;
        if (ct < todayStart && l.status !== 'Order Placed' && l.status !== 'Converted') overdueFollowups++;
      }
      if (l.status === 'Order Placed' && l.last_activity_at) {
        const ot = new Date(l.last_activity_at).getTime();
        if (ot >= todayStart && ot < todayEnd) ordersToday++;
      }
    });

    const worked = totalAssigned - untouched;
    const conversionRate = totalAssigned > 0 ? ((orderPlaced + converted) / totalAssigned * 100).toFixed(1) : '0.0';

    return {
      totalAssigned,
      untouched,
      contacted,
      followup,
      callback,
      interested,
      hotLead,
      orderPlaced,
      paymentPending,
      moneyProblem,
      noAnswer,
      notInterested,
      busy,
      wrongNumber,
      converted,
      worked,
      conversionRate,
      // Today's Work summary
      followupsToday,
      callbacksToday,
      overdueFollowups,
      ordersToday,
    };
  }

  // --- ADMIN METRICS ---
  public getAdminDashboardMetrics() {
    const totalLeads = this.leads.length;
    const assignedLeads = this.leads.filter(l => Boolean(l.assigned_to)).length;
    const unassignedLeads = totalLeads - assignedLeads;
    const hotLeads = this.leads.filter(l => l.status === 'Hot Lead').length;
    const ordersPlaced = this.leads.filter(l => l.status === 'Order Placed' || l.status === 'Converted').length;

    const totalValue = this.leads
      .filter(l => l.status === 'Order Placed' || l.status === 'Converted')
      .reduce((sum, l) => sum + (l.order_amount || l.amount || 0), 0);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    let followupsToday = 0;
    this.leads.forEach(l => {
      if (l.followup_date) {
        const ft = new Date(l.followup_date).getTime();
        if (ft >= todayStart && ft < todayEnd) followupsToday++;
      }
    });

    return {
      totalLeads,
      assignedLeads,
      unassignedLeads,
      hotLeads,
      ordersPlaced,
      totalValue,
      followupsToday,
      activeTelecallers: this.users.filter(u => u.role === 'telecaller' && u.is_active).length,
      activeDepartments: this.departments.filter(d => d.is_active).length,
    };
  }

  // --- EXPORT TO EXCEL / CSV ---
  public exportData(data: any[], fileName: string, format: 'xlsx' | 'csv' = 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    if (format === 'csv') {
      XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: 'csv' });
    } else {
      XLSX.writeFile(workbook, `${fileName}.xlsx`, { bookType: 'xlsx' });
    }
  }

  // --- SEED OR RESET ---
  public resetToDefaults() {
    localStorage.removeItem('leadflow_departments');
    localStorage.removeItem('leadflow_users');
    localStorage.removeItem('leadflow_statuses');
    localStorage.removeItem('leadflow_leads');
    localStorage.removeItem('leadflow_activities');
    this.init();
  }
}

export const db = DatabaseService.getInstance();
