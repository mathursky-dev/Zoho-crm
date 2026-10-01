import {
  Department,
  Lead,
  LeadActivity,
  LeadAssignment,
  LeadStatus,
  Profile,
  StandardLeadStatus,
  Followup,
  FieldMasterItem,
  ImportFieldMappingItem,
  TransformRule,
  FieldDataType
} from '../types/crm';
import { getSupabase, getSupabaseConfig } from './supabase';
import * as XLSX from 'xlsx';

// Transform Rule helper
export function applyTransform(val: any, rule: TransformRule): any {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  switch (rule) {
    case 'trim':
      return str;
    case 'digits_only':
      return str.replace(/\D/g, '');
    case 'uppercase':
      return str.toUpperCase();
    case 'lowercase':
      return str.toLowerCase();
    case 'titlecase':
      return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    case 'currency_to_number': {
      const num = parseFloat(str.replace(/[^0-9.-]+/g, ''));
      return isNaN(num) ? 0 : num;
    }
    case 'none':
    default:
      return val;
  }
}

// Initial Seed Data
const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Home Loans', code: 'HL', description: 'Mortgages and home refinance', is_active: true, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'dept-2', name: 'Health Insurance', code: 'INS', description: 'Comprehensive medical & term policies', is_active: true, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'dept-3', name: 'Credit Cards', code: 'CC', description: 'Premium & cashback credit solutions', is_active: true, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'dept-4', name: 'Personal Loans', code: 'PL', description: 'Instant unsecured personal credit', is_active: true, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
];

export const SUPERADMIN_UUID = 'a1000000-0000-4000-8000-000000000000';
export const ADMIN_UUID = 'a1000000-0000-4000-8000-000000000001';
export const ALEX_UUID  = 'a1000000-0000-4000-8000-000000000002';
export const PRIYA_UUID = 'a1000000-0000-4000-8000-000000000003';
export const MARCUS_UUID = 'a1000000-0000-4000-8000-000000000004';

// Helper to format currency in INR ₹
export function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

// Generate standard UUID v4
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULT_USERS: (Profile & { password?: string })[] = [
  {
    id: SUPERADMIN_UUID,
    email: 'superadmin@leadflow.com',
    username: 'superadmin',
    full_name: 'Super Administrator',
    role: 'admin',
    is_active: true,
    phone: '+91 9876543200',
    password: 'superadmin123',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: ADMIN_UUID,
    email: 'admin@leadflow.com',
    username: 'admin',
    full_name: 'Sarah Jenkins',
    role: 'admin',
    is_active: true,
    phone: '+91 9876543201',
    password: 'admin123',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: ALEX_UUID,
    email: 'alex@leadflow.com',
    username: 'alex',
    full_name: 'Alex Rivera',
    role: 'telecaller',
    is_active: true,
    phone: '+91 9876543202',
    password: 'alex123',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: PRIYA_UUID,
    email: 'priya@leadflow.com',
    username: 'priya',
    full_name: 'Priya Sharma',
    role: 'telecaller',
    is_active: true,
    phone: '+91 9876543203',
    password: 'priya123',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: MARCUS_UUID,
    email: 'marcus@leadflow.com',
    username: 'marcus',
    full_name: 'Marcus Vance',
    role: 'telecaller',
    is_active: true,
    phone: '+91 9876543204',
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
  { id: 'st-10', name: 'Thinking/Discussing', color: '#6366f1', is_active: true, display_order: 10, created_at: new Date().toISOString() },
  { id: 'st-11', name: 'No Answer', color: '#94a3b8', is_active: true, display_order: 11, created_at: new Date().toISOString() },
  { id: 'st-12', name: 'Busy', color: '#a8a29e', is_active: true, display_order: 12, created_at: new Date().toISOString() },
  { id: 'st-13', name: 'Switch Off/Unreachable', color: '#78716c', is_active: true, display_order: 13, created_at: new Date().toISOString() },
  { id: 'st-14', name: 'Not Interested', color: '#6b7280', is_active: true, display_order: 14, created_at: new Date().toISOString() },
  { id: 'st-15', name: 'Wrong Number', color: '#dc2626', is_active: true, display_order: 15, created_at: new Date().toISOString() },
  { id: 'st-16', name: 'Duplicate', color: '#b91c1c', is_active: true, display_order: 16, created_at: new Date().toISOString() },
  { id: 'st-17', name: 'Do Not Call', color: '#991b1b', is_active: true, display_order: 17, created_at: new Date().toISOString() },
  { id: 'st-18', name: 'Converted/Completed', color: '#059669', is_active: true, display_order: 18, created_at: new Date().toISOString() },
];

const DEFAULT_LEADS: Lead[] = [];

const DEFAULT_ACTIVITIES: LeadActivity[] = [];

const DEFAULT_ASSIGNMENTS: LeadAssignment[] = [];

export const DEFAULT_FIELD_MASTER: FieldMasterItem[] = [
  {
    id: 'fld-1',
    field_key: 'customer_name',
    field_label: 'Customer Name',
    data_type: 'text',
    is_required: true,
    is_system: true,
    is_active: true,
    placeholder: 'e.g. Rajesh Kumar',
    show_in_table: true,
    show_in_form: true,
    show_in_template: true,
    display_order: 1,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'fld-2',
    field_key: 'mobile',
    field_label: 'Mobile Number',
    data_type: 'phone',
    is_required: true,
    is_system: true,
    is_active: true,
    placeholder: '10-digit mobile number',
    show_in_table: true,
    show_in_form: true,
    show_in_template: true,
    display_order: 2,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'fld-3',
    field_key: 'alt_mobile',
    field_label: 'Alternate Mobile',
    data_type: 'phone',
    is_required: false,
    is_system: true,
    is_active: true,
    placeholder: 'Optional secondary phone',
    show_in_table: true,
    show_in_form: true,
    show_in_template: true,
    display_order: 3,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'fld-4',
    field_key: 'city',
    field_label: 'City',
    data_type: 'text',
    is_required: false,
    is_system: true,
    is_active: true,
    placeholder: 'e.g. Mumbai, New Delhi, Bengaluru',
    show_in_table: true,
    show_in_form: true,
    show_in_template: true,
    display_order: 4,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'fld-5',
    field_key: 'state',
    field_label: 'State',
    data_type: 'text',
    is_required: false,
    is_system: true,
    is_active: true,
    placeholder: 'e.g. Maharashtra, Karnataka',
    show_in_table: true,
    show_in_form: true,
    show_in_template: true,
    display_order: 5,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'fld-6',
    field_key: 'department',
    field_label: 'Department',
    data_type: 'select',
    is_required: true,
    is_system: true,
    is_active: true,
    placeholder: 'Assigned Department',
    show_in_table: true,
    show_in_form: true,
    show_in_template: true,
    display_order: 6,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'fld-7',
    field_key: 'product',
    field_label: 'Product',
    data_type: 'text',
    is_required: false,
    is_system: true,
    is_active: true,
    placeholder: 'e.g. Home Loan, Health Shield',
    show_in_table: true,
    show_in_form: true,
    show_in_template: true,
    display_order: 7,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'fld-8',
    field_key: 'amount',
    field_label: 'Amount / Deal Value',
    data_type: 'currency',
    is_required: false,
    is_system: true,
    is_active: true,
    placeholder: 'Estimated deal value in ₹',
    show_in_table: true,
    show_in_form: true,
    show_in_template: true,
    display_order: 8,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'fld-9',
    field_key: 'source',
    field_label: 'Lead Source',
    data_type: 'select',
    is_required: false,
    is_system: true,
    is_active: true,
    placeholder: 'Inbound channel',
    options: ['Website', 'Google Ads', 'Facebook Ads', 'IndiaMART', 'TradeIndia', 'Justdial', 'Referral', 'Excel Import'],
    show_in_table: true,
    show_in_form: true,
    show_in_template: true,
    display_order: 9,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'fld-10',
    field_key: 'previous_status',
    field_label: 'Previous Status',
    data_type: 'select',
    is_required: false,
    is_system: true,
    is_active: true,
    placeholder: 'Prior call disposition',
    options: ['Untouched', 'Contacted', 'Interested', 'Follow-up', 'Call Back', 'Hot Lead', 'Order Placed', 'Not Interested'],
    show_in_table: false,
    show_in_form: true,
    show_in_template: true,
    display_order: 10,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'fld-11',
    field_key: 'remark',
    field_label: 'Remark / Notes',
    data_type: 'textarea',
    is_required: false,
    is_system: true,
    is_active: true,
    placeholder: 'Customer notes or specific requirement',
    show_in_table: true,
    show_in_form: true,
    show_in_template: true,
    display_order: 11,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  // Custom fields
  {
    id: 'fld-12',
    field_key: 'pincode',
    field_label: 'Pincode',
    data_type: 'number',
    is_required: false,
    is_system: false,
    is_active: true,
    placeholder: '6-digit area PIN',
    show_in_table: false,
    show_in_form: true,
    show_in_template: true,
    display_order: 12,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'fld-13',
    field_key: 'email',
    field_label: 'Email Address',
    data_type: 'email',
    is_required: false,
    is_system: false,
    is_active: true,
    placeholder: 'customer@example.com',
    show_in_table: false,
    show_in_form: true,
    show_in_template: true,
    display_order: 13,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'fld-14',
    field_key: 'annual_income',
    field_label: 'Annual Income',
    data_type: 'currency',
    is_required: false,
    is_system: false,
    is_active: true,
    placeholder: 'Applicant annual income',
    show_in_table: false,
    show_in_form: true,
    show_in_template: false,
    display_order: 14,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  }
];

export const DEFAULT_IMPORT_MAPPINGS: ImportFieldMappingItem[] = [
  {
    id: 'map-1',
    field_key: 'customer_name',
    target_field_label: 'Customer Name',
    is_required: true,
    aliases: ['Customer Name', 'customer_name', 'Name', 'Full Name', 'Customer', 'Client Name', 'Lead Name', 'Candidate Name', 'Buyer Name'],
    transform_rule: 'titlecase',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'map-2',
    field_key: 'mobile',
    target_field_label: 'Mobile Number',
    is_required: true,
    aliases: ['Mobile Number', 'mobile', 'Mobile', 'Phone', 'Phone Number', 'Contact', 'Contact Number', 'Mobile No', 'Cell Phone', 'WhatsApp Number', 'WhatsApp'],
    transform_rule: 'digits_only',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'map-3',
    field_key: 'alt_mobile',
    target_field_label: 'Alternate Mobile',
    is_required: false,
    aliases: ['Alternate Mobile', 'alternate_mobile', 'alt_mobile', 'Alt Mobile', 'Alternate Phone', 'Secondary Phone', 'Alt Contact', 'Emergency Contact', 'Alt Phone'],
    transform_rule: 'digits_only',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'map-4',
    field_key: 'city',
    target_field_label: 'City',
    is_required: false,
    aliases: ['City', 'city', 'District', 'Town', 'Location', 'Current City', 'Customer City'],
    transform_rule: 'titlecase',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'map-5',
    field_key: 'state',
    target_field_label: 'State',
    is_required: false,
    aliases: ['State', 'state', 'Province', 'Region', 'State/UT', 'State Code'],
    transform_rule: 'titlecase',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'map-6',
    field_key: 'department',
    target_field_label: 'Department',
    is_required: true,
    aliases: ['Department', 'department', 'Dept', 'Vertical', 'Division', 'Category', 'Branch'],
    transform_rule: 'trim',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'map-7',
    field_key: 'product',
    target_field_label: 'Product',
    is_required: false,
    aliases: ['Product', 'product', 'Product Name', 'Item', 'Course', 'Plan', 'Loan Type', 'Policy', 'Service', 'Requirement', 'Package'],
    transform_rule: 'trim',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'map-8',
    field_key: 'amount',
    target_field_label: 'Amount / Deal Value',
    is_required: false,
    aliases: ['Amount', 'amount', 'Deal Amount', 'Price', 'Value', 'Deal Value', 'Fee', 'Budget', 'Loan Amount', 'Sum Insured', 'Package Price'],
    transform_rule: 'currency_to_number',
    default_value: '0',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'map-9',
    field_key: 'source',
    target_field_label: 'Lead Source',
    is_required: false,
    aliases: ['Source', 'source', 'Lead Source', 'Campaign', 'Platform', 'Channel', 'Vendor', 'Ad Name', 'Medium'],
    transform_rule: 'trim',
    default_value: 'Excel Import',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'map-10',
    field_key: 'previous_status',
    target_field_label: 'Previous Status',
    is_required: false,
    aliases: ['Previous Status', 'previous_status', 'Old Status', 'Last Status', 'Disposition', 'Call Status', 'Status', 'Stage'],
    transform_rule: 'trim',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'map-11',
    field_key: 'remark',
    target_field_label: 'Remark / Notes',
    is_required: false,
    aliases: ['Remark', 'remark', 'Remarks', 'Notes', 'Comment', 'Comments', 'Customer Requirement', 'Feedback', 'Description'],
    transform_rule: 'trim',
    default_value: 'Imported via CSV/Excel',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'map-12',
    field_key: 'pincode',
    target_field_label: 'Pincode',
    is_required: false,
    aliases: ['Pincode', 'pincode', 'PIN', 'Postal Code', 'Zip Code', 'Zip'],
    transform_rule: 'digits_only',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'map-13',
    field_key: 'email',
    target_field_label: 'Email Address',
    is_required: false,
    aliases: ['Email', 'email', 'Email Address', 'Mail ID', 'E-mail', 'Contact Email'],
    transform_rule: 'lowercase',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'map-14',
    field_key: 'annual_income',
    target_field_label: 'Annual Income',
    is_required: false,
    aliases: ['Annual Income', 'annual_income', 'Income', 'Salary', 'Monthly Salary', 'Turnover'],
    transform_rule: 'currency_to_number',
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  }
];

export class DatabaseService {
  private static instance: DatabaseService;

  private departments: Department[] = [...DEFAULT_DEPARTMENTS];
  private users: Profile[] = [];
  private statuses: LeadStatus[] = [...DEFAULT_STATUSES];
  private leads: Lead[] = [];
  private activities: LeadActivity[] = [];
  private leadAssignments: LeadAssignment[] = [];
  private fieldMaster: FieldMasterItem[] = [...DEFAULT_FIELD_MASTER];
  private importFieldMappings: ImportFieldMappingItem[] = [...DEFAULT_IMPORT_MAPPINGS];
  private currentUser: Profile | null = null;
  private isSyncing = false;

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
    // Permanent source of truth is Supabase.
    // Local memory caches are populated on app startup via checkSession() and syncFromSupabase().
    this.currentUser = null;
  }

  // --- SUPABASE SINGLE SOURCE OF TRUTH SYNC ---
  public async syncFromSupabase(): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Fetch departments
      const { data: depts, error: deptsErr } = await supabase
        .from('departments')
        .select('*')
        .order('created_at', { ascending: true });
      if (!deptsErr && depts && depts.length > 0) {
        this.departments = depts;
      }

      // 2. Fetch statuses
      const { data: stats, error: statsErr } = await supabase
        .from('lead_statuses')
        .select('*')
        .order('display_order', { ascending: true });
      if (!statsErr && stats && stats.length > 0) {
        this.statuses = stats;
      }

      // 3. Fetch profiles
      const { data: profs, error: profsErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });
      if (!profsErr && profs) {
        this.users = profs.map(p => ({
          ...p,
          is_active: p.is_active !== undefined ? p.is_active : (p.active !== undefined ? p.active : true),
        }));
        // Update currentUser if in list
        if (this.currentUser) {
          const fresh = this.users.find(u => u.id === this.currentUser!.id);
          if (fresh) this.currentUser = fresh;
        }
      }

      // 4. Fetch leads (strictly filtered by RLS if telecaller)
      const { data: leadsData, error: leadsErr } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (!leadsErr && leadsData) {
        this.leads = leadsData.map(l => ({
          ...l,
          mobile_unlock_count: l.mobile_unlock_count || 0,
        }));
      }

      // 5. Fetch activities
      const { data: acts, error: actsErr } = await supabase
        .from('lead_activities')
        .select('*')
        .order('created_at', { ascending: false });
      if (!actsErr && acts) {
        this.activities = acts;
      }

      // 6. Fetch assignments
      const { data: assigns, error: assignErr } = await supabase
        .from('lead_assignments')
        .select('*')
        .order('created_at', { ascending: false });
      if (!assignErr && assigns) {
        this.leadAssignments = assigns;
      }
    } catch (err) {
      console.warn('Supabase data synchronization warning:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  // --- WIPE ALL DATA ---
  public async clearAllData(options?: { resetMasters?: boolean }) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('lead_activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('lead_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('followups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Error clearing Supabase remote data:', err);
      }
    }

    this.leads = [];
    this.activities = [];
    this.leadAssignments = [];

    if (options?.resetMasters) {
      this.departments = [...DEFAULT_DEPARTMENTS];
      this.statuses = [...DEFAULT_STATUSES];
      this.fieldMaster = [...DEFAULT_FIELD_MASTER];
      this.importFieldMappings = [...DEFAULT_IMPORT_MAPPINGS];
    }

    if (supabase) {
      await this.syncFromSupabase();
    }
  }

  // --- AUTHENTICATION & SESSION PERSISTENCE ---
  public getCurrentUser(): Profile | null {
    return this.currentUser;
  }

  public setCurrentUser(user: Profile | null) {
    this.currentUser = user;
  }

  public async checkSession(): Promise<{ user: Profile | null; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      this.currentUser = null;
      return { user: null };
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        this.currentUser = null;
        return { user: null };
      }

      // Re-fetch profile from Supabase profiles table
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profError || !profile) {
        console.error('Session user profile not found:', profError);
        this.currentUser = null;
        return { user: null };
      }

      const isActive = profile.is_active !== undefined ? profile.is_active : (profile.active !== undefined ? profile.active : true);
      if (!isActive) {
        await supabase.auth.signOut();
        this.currentUser = null;
        return { user: null, error: 'Your account has been deactivated. Please contact your CRM administrator.' };
      }

      const activeProfile: Profile = {
        ...profile,
        is_active: true,
      };

      this.currentUser = activeProfile;
      await this.syncFromSupabase();
      return { user: this.currentUser };
    } catch (err: any) {
      console.error('Session check error:', err);
      this.currentUser = null;
      return { user: null, error: err?.message };
    }
  }

  public async signIn(identifier: string, pass: string): Promise<{ user?: Profile | null; error?: string }> {
    const cleanId = String(identifier || '').trim();
    const cleanPass = String(pass || '').trim();

    if (!cleanId) {
      return { error: 'User ID or Email is required.' };
    }

    if (!cleanPass) {
      return { error: 'Password is required. Login is not permitted without a password.' };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { error: 'Supabase database is not configured. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    try {
      let targetEmail = cleanId;

      // If user provided a username or user ID (no '@'), lookup their email in Supabase profiles table
      if (!cleanId.includes('@')) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('email, username')
          .ilike('username', cleanId);

        if (profs && profs.length > 0 && profs[0].email) {
          targetEmail = profs[0].email;
        } else {
          // If not found by username directly, try matching username prefix or email
          const { data: allProfs } = await supabase.from('profiles').select('email, username');
          const matched = allProfs?.find(p =>
            (p.username && p.username.toLowerCase() === cleanId.toLowerCase()) ||
            p.email.toLowerCase().startsWith(cleanId.toLowerCase() + '@')
          );
          if (matched?.email) {
            targetEmail = matched.email;
          }
        }
      }

      // Execute real Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: cleanPass,
      });

      if (authError || !authData.user) {
        return { error: authError?.message || 'Invalid User ID / Email or password.' };
      }

      // Fetch profile from Supabase profiles table
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profError || !profile) {
        return { error: 'User profile not found in Supabase database. Please contact your administrator.' };
      }

      const isActive = profile.is_active !== undefined ? profile.is_active : (profile.active !== undefined ? profile.active : true);
      if (!isActive) {
        await supabase.auth.signOut();
        return { error: 'Your account has been deactivated. Please contact your CRM administrator.' };
      }

      this.currentUser = {
        ...profile,
        is_active: true,
      };

      // Synchronize database records from Supabase
      await this.syncFromSupabase();

      return { user: this.currentUser };
    } catch (err: any) {
      console.error('Sign-in error:', err);
      return { error: err?.message || 'Authentication error. Please check your credentials.' };
    }
  }

  public async signOut(): Promise<void> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out error:', err);
      }
    }
    this.currentUser = null;
  }

  // --- DEPARTMENTS MASTER ---
  public getDepartments(includeInactive = false): Department[] {
    if (includeInactive) return [...this.departments];
    return this.departments.filter(d => d.is_active);
  }

  public async addDepartment(dept: Omit<Department, 'id' | 'created_at'>): Promise<{ department?: Department; error?: string }> {
    const supabase = getSupabase();
    const newDept: Department = {
      id: generateUUID(),
      created_at: new Date().toISOString(),
      ...dept,
    };

    if (supabase) {
      const { data, error } = await supabase.from('departments').insert([{
        id: newDept.id,
        name: newDept.name,
        code: newDept.code,
        description: newDept.description,
        is_active: newDept.is_active,
      }]).select().single();

      if (error) {
        console.error('Failed to create department in Supabase:', error);
        return { error: error.message };
      }

      // Re-fetch departments from Supabase
      const { data: allDepts } = await supabase.from('departments').select('*').order('created_at', { ascending: true });
      if (allDepts) this.departments = allDepts;

      return { department: data || newDept };
    }

    this.departments.push(newDept);
    return { department: newDept };
  }

  public async updateDepartment(id: string, updates: Partial<Department>): Promise<{ department?: Department; error?: string }> {
    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase.from('departments').update(updates).eq('id', id).select().single();
      if (error) {
        console.error('Failed to update department in Supabase:', error);
        return { error: error.message };
      }

      // Re-fetch departments from Supabase
      const { data: allDepts } = await supabase.from('departments').select('*').order('created_at', { ascending: true });
      if (allDepts) this.departments = allDepts;

      return { department: data };
    }

    const index = this.departments.findIndex(d => d.id === id);
    if (index === -1) return { error: 'Department not found' };
    this.departments[index] = { ...this.departments[index], ...updates };
    return { department: this.departments[index] };
  }

  // --- USER MASTER ---
  public getUsers(includeInactive = false): Profile[] {
    return includeInactive ? [...this.users] : this.users.filter(u => u.is_active);
  }

  public getTelecallersByDepartment(_departmentId?: string): Profile[] {
    // Telecallers are independent of departments
    return this.getUsers(false).filter(u => u.role === 'telecaller');
  }

  public async addUser(user: Omit<Profile, 'id' | 'created_at'> & { password?: string }): Promise<{ user?: Profile; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: 'Supabase database is not connected.' };
    }

    const cleanEmail = user.email.trim().toLowerCase();
    const cleanPass = (user.password || 'Temporary123!').trim();
    const cleanUsername = user.username || cleanEmail.split('@')[0];

    // Create user in Supabase Auth via signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPass,
      options: {
        data: {
          full_name: user.full_name,
          username: cleanUsername,
          role: user.role,
        },
      },
    });

    if (authError) {
      console.error('Supabase signUp error:', authError);
      return { error: authError.message };
    }

    const userId = authData.user?.id || generateUUID();
    const now = new Date().toISOString();
    const profileRecord = {
      id: userId,
      email: cleanEmail,
      full_name: user.full_name,
      username: cleanUsername,
      role: user.role,
      phone: user.phone || '',
      mobile: user.phone || '',
      is_active: user.is_active !== undefined ? user.is_active : true,
      active: user.is_active !== undefined ? user.is_active : true,
      created_at: now,
    };

    let { error: profError } = await supabase.from('profiles').upsert([profileRecord]);
    if (profError) {
      // Fallback in case table doesn't have mobile or active
      const minimalRecord = {
        id: userId,
        email: cleanEmail,
        full_name: user.full_name,
        username: cleanUsername,
        role: user.role,
        phone: user.phone || '',
        is_active: user.is_active !== undefined ? user.is_active : true,
        created_at: now,
      };
      const res = await supabase.from('profiles').upsert([minimalRecord]);
      profError = res.error;
    }

    if (profError) {
      console.error('Failed to create profile in Supabase:', profError);
      return { error: profError.message };
    }

    // Re-fetch all users from Supabase (single source of truth)
    const { data: allUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    if (allUsers) {
      this.users = allUsers.map(u => ({
        ...u,
        is_active: u.is_active !== undefined ? u.is_active : (u.active !== undefined ? u.active : true),
      }));
    }

    const created = this.users.find(u => u.id === userId) || (profileRecord as unknown as Profile);
    return { user: created };
  }

  public async updateUser(id: string, updates: Partial<Profile & { password?: string }>): Promise<{ user?: Profile; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: 'Supabase database is not configured.' };
    }

    // Prepare clean payload for profiles table - NEVER include password in profiles table
    const payload: Record<string, any> = {};
    if (updates.full_name !== undefined) payload.full_name = updates.full_name;
    if (updates.username !== undefined) payload.username = updates.username;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.phone !== undefined) {
      payload.phone = updates.phone;
    }
    if (updates.is_active !== undefined) {
      payload.is_active = updates.is_active;
    }

    let updateError: any = null;
    let res = await supabase.from('profiles').update(payload).eq('id', id);

    if (res.error) {
      console.warn('Initial profiles update error, trying schema fallbacks:', res.error);
      const fallbackPayload: Record<string, any> = { ...payload };
      if (updates.phone !== undefined) {
        fallbackPayload.mobile = updates.phone;
      }
      if (updates.is_active !== undefined) {
        fallbackPayload.active = updates.is_active;
      }
      res = await supabase.from('profiles').update(fallbackPayload).eq('id', id);
      if (res.error) {
        updateError = res.error;
      }
    }

    if (updateError) {
      console.error('Failed to update profile in Supabase:', updateError);
      return { error: updateError.message || 'Failed to update user profile in Supabase.' };
    }

    // If logged-in user is updating their own password:
    if (updates.password && this.currentUser && this.currentUser.id === id) {
      const { error: passErr } = await supabase.auth.updateUser({ password: updates.password });
      if (passErr) {
        console.warn('Password update error for logged-in user:', passErr);
        return { error: `Profile updated, but password change failed: ${passErr.message}` };
      }
    }

    // Re-fetch user from Supabase (single source of truth)
    const { data: refreshedUser, error: refErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (refErr || !refreshedUser) {
      console.error('Error re-fetching updated user from Supabase:', refErr);
    } else {
      const normalized: Profile = {
        ...refreshedUser,
        is_active: refreshedUser.is_active !== undefined ? refreshedUser.is_active : (refreshedUser.active !== undefined ? refreshedUser.active : true),
      };

      const idx = this.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        this.users[idx] = normalized;
      } else {
        this.users.push(normalized);
      }
      if (this.currentUser?.id === id) {
        this.currentUser = normalized;
      }
      return { user: normalized };
    }

    return { user: this.users.find(u => u.id === id) };
  }

  // --- STATUS MASTER ---
  public getStatuses(includeInactive = false): LeadStatus[] {
    const list = includeInactive ? [...this.statuses] : this.statuses.filter(s => s.is_active);
    return list.sort((a, b) => a.display_order - b.display_order);
  }

  public async addStatus(status: Omit<LeadStatus, 'id' | 'created_at'>): Promise<{ status?: LeadStatus; error?: string }> {
    const supabase = getSupabase();
    const newStatus: LeadStatus = {
      id: generateUUID(),
      created_at: new Date().toISOString(),
      ...status,
    };

    if (supabase) {
      const { data, error } = await supabase.from('lead_statuses').insert([newStatus]).select().single();
      if (error) {
        console.error('Failed to add status in Supabase:', error);
        return { error: error.message };
      }

      const { data: allStatuses } = await supabase.from('lead_statuses').select('*').order('display_order', { ascending: true });
      if (allStatuses) this.statuses = allStatuses;

      return { status: data || newStatus };
    }

    this.statuses.push(newStatus);
    return { status: newStatus };
  }

  public async updateStatus(id: string, updates: Partial<LeadStatus>): Promise<{ status?: LeadStatus; error?: string }> {
    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase.from('lead_statuses').update(updates).eq('id', id).select().single();
      if (error) {
        console.error('Failed to update status in Supabase:', error);
        return { error: error.message };
      }

      const { data: allStatuses } = await supabase.from('lead_statuses').select('*').order('display_order', { ascending: true });
      if (allStatuses) this.statuses = allStatuses;

      return { status: data };
    }

    const index = this.statuses.findIndex(s => s.id === id);
    if (index === -1) return { error: 'Status not found' };
    this.statuses[index] = { ...this.statuses[index], ...updates };
    return { status: { ...this.statuses[index] } };
  }

  public async reorderStatuses(orderedIds: string[]): Promise<LeadStatus[]> {
    const supabase = getSupabase();
    if (supabase) {
      for (let i = 0; i < orderedIds.length; i++) {
        await supabase.from('lead_statuses').update({ display_order: i + 1 }).eq('id', orderedIds[i]);
      }
      const { data } = await supabase.from('lead_statuses').select('*').order('display_order', { ascending: true });
      if (data) this.statuses = data;
    } else {
      orderedIds.forEach((id, index) => {
        const found = this.statuses.find(s => s.id === id);
        if (found) found.display_order = index + 1;
      });
      this.statuses.sort((a, b) => a.display_order - b.display_order);
    }
    return [...this.statuses];
  }

  public async moveStatus(statusId: string, direction: 'up' | 'down'): Promise<LeadStatus[]> {
    const sorted = [...this.statuses].sort((a, b) => a.display_order - b.display_order);
    const index = sorted.findIndex(s => s.id === statusId);
    if (index === -1) return [...this.statuses];

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return [...this.statuses];

    const current = sorted[index];
    const target = sorted[targetIndex];

    const currentOrder = current.display_order;
    const targetOrder = target.display_order;

    current.display_order = targetOrder;
    target.display_order = currentOrder;

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('lead_statuses').update({ display_order: targetOrder }).eq('id', current.id);
      await supabase.from('lead_statuses').update({ display_order: currentOrder }).eq('id', target.id);
      const { data } = await supabase.from('lead_statuses').select('*').order('display_order', { ascending: true });
      if (data) this.statuses = data;
    } else {
      this.statuses.sort((a, b) => a.display_order - b.display_order);
    }
    return [...this.statuses];
  }

  // --- FIELD MASTER ---
  public getFieldMaster(includeInactive = false): FieldMasterItem[] {
    const list = includeInactive ? [...this.fieldMaster] : this.fieldMaster.filter(f => f.is_active);
    return list.sort((a, b) => a.display_order - b.display_order);
  }

  public getFieldByKey(fieldKey: string): FieldMasterItem | undefined {
    return this.fieldMaster.find(f => f.field_key.toLowerCase() === fieldKey.toLowerCase());
  }

  public addField(field: Omit<FieldMasterItem, 'id' | 'created_at'>): FieldMasterItem {
    const newField: FieldMasterItem = {
      id: `fld-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...field,
    };
    this.fieldMaster.push(newField);

    // Auto-create an Import Field Mapping for this new field
    this.syncImportMappingsWithFieldMaster();

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('field_master').insert([newField]).then();
    }
    return newField;
  }

  public updateField(id: string, updates: Partial<FieldMasterItem>): FieldMasterItem | null {
    const index = this.fieldMaster.findIndex(f => f.id === id);
    if (index === -1) return null;

    // Prevent changing field_key of system fields
    if (this.fieldMaster[index].is_system && updates.field_key && updates.field_key !== this.fieldMaster[index].field_key) {
      delete updates.field_key;
    }

    this.fieldMaster[index] = {
      ...this.fieldMaster[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Sync label to import mapping if changed
    if (updates.field_label) {
      const mappingIdx = this.importFieldMappings.findIndex(m => m.field_key === this.fieldMaster[index].field_key);
      if (mappingIdx !== -1) {
        this.importFieldMappings[mappingIdx].target_field_label = updates.field_label;
      }
    }

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('field_master').update(updates).eq('id', id).then();
    }
    return this.fieldMaster[index];
  }

  public deleteField(id: string): { success: boolean; message?: string } {
    const field = this.fieldMaster.find(f => f.id === id);
    if (!field) return { success: false, message: 'Field not found' };
    if (field.is_system) {
      return { success: false, message: 'Standard system fields cannot be deleted. You can deactivate them instead.' };
    }

    this.fieldMaster = this.fieldMaster.filter(f => f.id !== id);

    // Also remove from import field mappings
    this.importFieldMappings = this.importFieldMappings.filter(m => m.field_key !== field.field_key);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('field_master').delete().eq('id', id).then();
    }
    return { success: true };
  }

  // --- IMPORT FILE FIELD MASTER ---
  public getImportFieldMappings(includeInactive = false): ImportFieldMappingItem[] {
    if (includeInactive) return [...this.importFieldMappings];
    return this.importFieldMappings.filter(m => m.is_active);
  }

  public addImportFieldMapping(mapping: Omit<ImportFieldMappingItem, 'id' | 'created_at'>): ImportFieldMappingItem {
    const newMapping: ImportFieldMappingItem = {
      id: `map-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...mapping,
    };
    this.importFieldMappings.push(newMapping);
    return newMapping;
  }

  public updateImportFieldMapping(id: string, updates: Partial<ImportFieldMappingItem>): ImportFieldMappingItem | null {
    const index = this.importFieldMappings.findIndex(m => m.id === id);
    if (index === -1) return null;
    this.importFieldMappings[index] = {
      ...this.importFieldMappings[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.importFieldMappings[index];
  }

  public deleteImportFieldMapping(id: string): boolean {
    const before = this.importFieldMappings.length;
    this.importFieldMappings = this.importFieldMappings.filter(m => m.id !== id);
    return this.importFieldMappings.length < before;
  }

  /**
   * Matches any raw CSV/Excel column header against the configured Import Field Mappings
   */
  public autoMatchColumnHeader(headerName: string): string | null {
    if (!headerName || !headerName.trim()) return null;
    const cleanHeader = headerName.trim();
    const normalized = cleanHeader.toLowerCase().replace(/[^a-z0-9]/g, '');

    const activeMappings = this.importFieldMappings.filter(m => m.is_active);

    // 1. Exact match on alias or field_key (case-insensitive)
    for (const m of activeMappings) {
      if (m.field_key.toLowerCase() === cleanHeader.toLowerCase()) return m.field_key;
      if (m.target_field_label.toLowerCase() === cleanHeader.toLowerCase()) return m.field_key;
      for (const alias of m.aliases) {
        if (alias.toLowerCase() === cleanHeader.toLowerCase()) return m.field_key;
      }
    }

    // 2. Normalized match (without spaces, punctuation, or casing)
    for (const m of activeMappings) {
      if (m.field_key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized) return m.field_key;
      if (m.target_field_label.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized) return m.field_key;
      for (const alias of m.aliases) {
        if (alias.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized) return m.field_key;
      }
    }

    // 3. Substring heuristic for common fields
    for (const m of activeMappings) {
      for (const alias of m.aliases) {
        const normAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normAlias.length >= 4 && (normalized.includes(normAlias) || normAlias.includes(normalized))) {
          return m.field_key;
        }
      }
    }

    return null;
  }

  /**
   * Synchronizes Import Field Mappings with all active fields in Field Master.
   * Ensures any custom field added by the user has mapping rules.
   */
  public syncImportMappingsWithFieldMaster(): { added: number; total: number } {
    let addedCount = 0;
    this.fieldMaster.forEach(fld => {
      const exists = this.importFieldMappings.some(m => m.field_key === fld.field_key);
      if (!exists) {
        const defaultTransform: TransformRule =
          fld.data_type === 'phone' ? 'digits_only' :
          fld.data_type === 'currency' ? 'currency_to_number' :
          fld.data_type === 'email' ? 'lowercase' : 'trim';

        const newMap: ImportFieldMappingItem = {
          id: `map-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          field_key: fld.field_key,
          target_field_label: fld.field_label,
          is_required: fld.is_required,
          aliases: [fld.field_label, fld.field_key, fld.field_label.replace(/\s+/g, '')],
          transform_rule: defaultTransform,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        this.importFieldMappings.push(newMap);
        addedCount++;
      }
    });

    return { added: addedCount, total: this.importFieldMappings.length };
  }

  public resetMappingsToDefault(): void {
    this.importFieldMappings = DEFAULT_IMPORT_MAPPINGS;
  }

  /**
   * Generates a verified sample spreadsheet template containing all configured template columns.
   */
  public generateDynamicSampleTemplate(format: 'xlsx' | 'csv' = 'csv') {
    const activeTemplateFields = this.fieldMaster.filter(f => f.is_active && f.show_in_template);
    
    // Create rich sample records with standard Indian CRM values
    const row1: Record<string, any> = {};
    const row2: Record<string, any> = {};

    activeTemplateFields.forEach(f => {
      const colName = f.field_label;
      switch (f.field_key) {
        case 'customer_name':
          row1[colName] = 'Rajesh Kumar';
          row2[colName] = 'Pooja Sharma';
          break;
        case 'mobile':
          row1[colName] = '9876543210';
          row2[colName] = '9812345678';
          break;
        case 'alt_mobile':
          row1[colName] = '9876543211';
          row2[colName] = '';
          break;
        case 'city':
          row1[colName] = 'Mumbai';
          row2[colName] = 'Bengaluru';
          break;
        case 'state':
          row1[colName] = 'Maharashtra';
          row2[colName] = 'Karnataka';
          break;
        case 'department':
          row1[colName] = 'Home Loans';
          row2[colName] = 'Health Insurance';
          break;
        case 'product':
          row1[colName] = 'Fixed 30Y Mortgage';
          row2[colName] = 'Family Health Shield';
          break;
        case 'amount':
          row1[colName] = 3500000;
          row2[colName] = 25000;
          break;
        case 'source':
          row1[colName] = 'Website';
          row2[colName] = 'Facebook Ad';
          break;
        case 'previous_status':
          row1[colName] = 'Untouched';
          row2[colName] = 'Interested';
          break;
        case 'remark':
          row1[colName] = 'First time home buyer with high credit score';
          row2[colName] = 'Requested cashless hospital network list';
          break;
        case 'pincode':
          row1[colName] = '400001';
          row2[colName] = '560001';
          break;
        case 'email':
          row1[colName] = 'rajesh.kumar@example.com';
          row2[colName] = 'pooja.sharma@example.com';
          break;
        case 'annual_income':
          row1[colName] = 1200000;
          row2[colName] = 850000;
          break;
        default:
          row1[colName] = f.default_value || `Sample ${f.field_label}`;
          row2[colName] = f.default_value || `Sample ${f.field_label}`;
          break;
      }
    });

    this.exportData([row1, row2], 'CRM_Leads_Import_Template', format);
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
    dateRange?: 'all' | 'today' | 'yesterday' | 'week' | '7days' | '30days' | 'month' | 'custom';
    startDate?: string;
    endDate?: string;
    onlyUnassigned?: boolean;
    assignment_status?: 'all' | 'assigned' | 'unassigned';
    assigned_date_range?: 'all' | 'today' | 'yesterday' | 'week' | '7days' | '30days' | 'month' | 'custom';
    assigned_start_date?: string;
    assigned_end_date?: string;
    followup_date_range?: 'all' | 'today' | 'tomorrow' | 'week' | 'overdue' | 'custom';
    followup_start_date?: string;
    followup_end_date?: string;
  }): Lead[] {
    const user = this.getCurrentUser();
    let result = [...this.leads];

    // STRICT SECURITY / RLS:
    // If current user is a telecaller, NEVER permit access to other users' leads!
    if (user && user.role === 'telecaller') {
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

    // Assignment Status Filter: all | assigned | unassigned
    if (filters.assignment_status && filters.assignment_status !== 'all') {
      if (filters.assignment_status === 'unassigned') {
        result = result.filter(l => !l.assigned_to);
      } else if (filters.assignment_status === 'assigned') {
        result = result.filter(l => Boolean(l.assigned_to));
      }
    }

    // Department filter
    if (filters.department_id) {
      result = result.filter(l => l.department_id === filters.department_id);
    }

    // User filter (only applies to admin)
    if (user && user.role === 'admin' && filters.user_id) {
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

    // Import / Created Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterdayStart = todayStart - 86400000;
      const weekStart = todayStart - 7 * 86400000;
      const days7Start = todayStart - 6 * 86400000;
      const days30Start = todayStart - 29 * 86400000;
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
          case '7days':
            return leadTime >= days7Start;
          case '30days':
            return leadTime >= days30Start;
          case 'month':
            return leadTime >= monthStart;
          case 'custom': {
            const start = filters.startDate ? new Date(filters.startDate).getTime() : null;
            const end = filters.endDate ? new Date(filters.endDate).getTime() + 86400000 : null; // include end of day
            if (start && end) return leadTime >= start && leadTime <= end;
            if (start) return leadTime >= start;
            if (end) return leadTime <= end;
            return true;
          }
          default:
            return true;
        }
      });
    }

    // Assigned Date range filter
    if (filters.assigned_date_range && filters.assigned_date_range !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterdayStart = todayStart - 86400000;
      const weekStart = todayStart - 7 * 86400000;
      const days7Start = todayStart - 6 * 86400000;
      const days30Start = todayStart - 29 * 86400000;
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      result = result.filter(l => {
        if (!l.assigned_at) return false;
        const asgnTime = new Date(l.assigned_at).getTime();
        switch (filters.assigned_date_range) {
          case 'today':
            return asgnTime >= todayStart;
          case 'yesterday':
            return asgnTime >= yesterdayStart && asgnTime < todayStart;
          case 'week':
            return asgnTime >= weekStart;
          case '7days':
            return asgnTime >= days7Start;
          case '30days':
            return asgnTime >= days30Start;
          case 'month':
            return asgnTime >= monthStart;
          case 'custom': {
            const start = filters.assigned_start_date ? new Date(filters.assigned_start_date).getTime() : null;
            const end = filters.assigned_end_date ? new Date(filters.assigned_end_date).getTime() + 86400000 : null;
            if (start && end) return asgnTime >= start && asgnTime <= end;
            if (start) return asgnTime >= start;
            if (end) return asgnTime <= end;
            return true;
          }
          default:
            return true;
        }
      });
    }

    // Follow-up Date range filter
    if (filters.followup_date_range && filters.followup_date_range !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const tomorrowStart = todayStart + 86400000;
      const tomorrowEnd = tomorrowStart + 86400000;
      const weekEnd = todayStart + 7 * 86400000;

      result = result.filter(l => {
        if (!l.followup_date) return false;
        const fuTime = new Date(l.followup_date).getTime();
        switch (filters.followup_date_range) {
          case 'today':
            return fuTime >= todayStart && fuTime < tomorrowStart;
          case 'tomorrow':
            return fuTime >= tomorrowStart && fuTime < tomorrowEnd;
          case 'week':
            return fuTime >= todayStart && fuTime <= weekEnd;
          case 'overdue':
            return fuTime < todayStart;
          case 'custom': {
            const start = filters.followup_start_date ? new Date(filters.followup_start_date).getTime() : null;
            const end = filters.followup_end_date ? new Date(filters.followup_end_date).getTime() + 86400000 : null;
            if (start && end) return fuTime >= start && fuTime <= end;
            if (start) return fuTime >= start;
            if (end) return fuTime <= end;
            return true;
          }
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
    if (user && user.role === 'telecaller' && lead.assigned_to !== user.id) {
      return null; // Deny access
    }
    return lead;
  }

  // --- MANUAL LEAD ASSIGNMENT & REASSIGNMENT ---
  public async assignLeads(leadIds: string[], assignToUserId: string): Promise<{ successCount: number; message: string; error?: string }> {
    const user = this.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { successCount: 0, message: 'Unauthorized. Only admins can assign leads.', error: 'Unauthorized' };
    }

    const targetUser = this.users.find(u => u.id === assignToUserId);
    if (!targetUser) {
      return { successCount: 0, message: 'Assigned user not found or inactive.', error: 'User not found' };
    }

    const now = new Date().toISOString();
    const supabase = getSupabase();

    if (supabase) {
      const { error: updateErr } = await supabase
        .from('leads')
        .update({
          assigned_to: targetUser.id,
          assigned_at: now,
        })
        .in('id', leadIds);

      if (updateErr) {
        console.error('Failed to assign leads in Supabase:', updateErr);
        return { successCount: 0, message: 'Failed to assign leads in database.', error: updateErr.message };
      }

      // Requirement 7 & 8: Complete assignment history audit log in Supabase
      const newAssignments = leadIds.map(leadId => {
        const existingLead = this.leads.find(l => l.id === leadId);
        return {
          id: generateUUID(),
          lead_id: leadId,
          previous_user_id: existingLead?.assigned_to || null,
          assigned_to: targetUser.id,
          assigned_by: user.id,
          department_id: existingLead?.department_id || null,
          assigned_at: now,
        };
      });

      await supabase.from('lead_assignments').insert(newAssignments);

      // Record activity logs in Supabase
      const activityRows = leadIds.map(leadId => ({
        id: generateUUID(),
        lead_id: leadId,
        user_id: user.id,
        user_name: user.full_name,
        status: 'Assigned',
        remark: `Lead assigned to ${targetUser.full_name} by Admin`,
        created_at: now,
      }));

      await supabase.from('lead_activities').insert(activityRows);

      // Re-fetch all updated data from Supabase (single source of truth)
      const { data: refreshedLeads } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (refreshedLeads) this.leads = refreshedLeads;

      const { data: refreshedAssigns } = await supabase.from('lead_assignments').select('*').order('created_at', { ascending: false });
      if (refreshedAssigns) this.leadAssignments = refreshedAssigns;

      const { data: refreshedActs } = await supabase.from('lead_activities').select('*').order('created_at', { ascending: false });
      if (refreshedActs) this.activities = refreshedActs;

      return { successCount: leadIds.length, message: `Successfully assigned ${leadIds.length} lead(s) to ${targetUser.full_name}.` };
    }

    return { successCount: 0, message: 'Database not connected.', error: 'No database' };
  }

  // --- ASSIGNMENT HISTORY (AUDIT TRAIL) ---
  public getLeadAssignments(leadId: string): (LeadAssignment & {
    previous_user_name?: string;
    assigned_to_name?: string;
    assigned_by_name?: string;
  })[] {
    return this.leadAssignments
      .filter(a => a.lead_id === leadId)
      .map(a => {
        const prevUser = a.previous_user_id ? this.users.find(u => u.id === a.previous_user_id) : null;
        const targetUser = this.users.find(u => u.id === a.assigned_to);
        const byUser = this.users.find(u => u.id === a.assigned_by);
        return {
          ...a,
          previous_user_name: prevUser ? prevUser.full_name : (a.previous_user_id ? 'Previous User' : 'Unassigned / New Pool'),
          assigned_to_name: targetUser ? targetUser.full_name : 'Unknown User',
          assigned_by_name: byUser ? byUser.full_name : 'System / Admin',
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // --- ADMIN LEAD POOL SUMMARY & USER-WISE METRICS ---
  public getAdminLeadPoolSummary() {
    const totalLeads = this.leads.length;
    const assignedLeads = this.leads.filter(l => Boolean(l.assigned_to)).length;
    const unassignedLeads = totalLeads - assignedLeads;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    let assignedToday = 0;
    this.leads.forEach(l => {
      if (l.assigned_at) {
        const t = new Date(l.assigned_at).getTime();
        if (t >= todayStart && t < todayEnd) assignedToday++;
      }
    });

    const activeTelecallers = this.users.filter(u => u.role === 'telecaller' && u.is_active);
    const userStats = activeTelecallers.map(u => {
      let count = 0;
      let todayCount = 0;
      this.leads.forEach(l => {
        if (l.assigned_to === u.id) {
          count++;
          if (l.assigned_at) {
            const t = new Date(l.assigned_at).getTime();
            if (t >= todayStart && t < todayEnd) todayCount++;
          }
        }
      });
      return {
        user: u,
        assignedCount: count,
        assignedTodayCount: todayCount,
      };
    });

    return {
      totalLeads,
      unassignedLeads,
      assignedLeads,
      assignedToday,
      userStats,
    };
  }

  // --- EXCEL / CSV IMPORT ---
  public async importLeads(
    rows: any[],
    departmentId: string,
    columnMap: Record<string, string>
  ): Promise<{
    totalRows: number;
    importedCount: number;
    duplicateMobiles: string[];
    skippedRows: number;
    createdLeads: Lead[];
  }> {
    const dept = this.departments.find(d => d.id === departmentId);
    const existingMobiles = new Set(this.leads.map(l => l.mobile.replace(/\D/g, '')));
    const duplicateMobiles: string[] = [];
    const newLeads: Lead[] = [];

    // Map rules dictionary for fast lookup
    const transformMap = new Map<string, TransformRule>();
    this.importFieldMappings.forEach(m => transformMap.set(m.field_key, m.transform_rule));

    // Find highest current lead number
    let maxNumber = 1000;
    this.leads.forEach(l => {
      const num = parseInt(l.lead_code.replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    });

    const mobileCol = columnMap['mobile'] || columnMap['Mobile Number'] || '';
    const nameCol = columnMap['customer_name'] || columnMap['Customer Name'] || '';

    rows.forEach(row => {
      const rawMobileVal = mobileCol ? row[mobileCol] : '';
      const rawNameVal = nameCol ? row[nameCol] : '';

      const mobileRule = transformMap.get('mobile') || 'digits_only';
      const cleanMobile = applyTransform(rawMobileVal, mobileRule);

      const nameRule = transformMap.get('customer_name') || 'titlecase';
      const cleanName = applyTransform(rawNameVal, nameRule);

      if (!cleanMobile || !cleanName) {
        return; // skip rows without required name & mobile
      }

      // Check duplicates
      if (existingMobiles.has(cleanMobile)) {
        duplicateMobiles.push(cleanMobile);
        return;
      }
      existingMobiles.add(cleanMobile);

      maxNumber++;
      const leadCode = `LD-${maxNumber}`;

      // Alternate mobile
      const altCol = columnMap['alt_mobile'] || columnMap['alternate_mobile'] || '';
      const altRule = transformMap.get('alt_mobile') || 'digits_only';
      const alt_mobile = altCol && row[altCol] ? applyTransform(row[altCol], altRule) : undefined;

      // City & State
      const cityCol = columnMap['city'] || '';
      const cityRule = transformMap.get('city') || 'titlecase';
      const city = cityCol && row[cityCol] ? applyTransform(row[cityCol], cityRule) : undefined;

      const stateCol = columnMap['state'] || '';
      const stateRule = transformMap.get('state') || 'titlecase';
      const state = stateCol && row[stateCol] ? applyTransform(row[stateCol], stateRule) : undefined;

      // Amount
      const amtCol = columnMap['amount'] || '';
      const amtRule = transformMap.get('amount') || 'currency_to_number';
      const rawAmount = amtCol && row[amtCol] !== undefined ? applyTransform(row[amtCol], amtRule) : 0;
      const amount = typeof rawAmount === 'number' ? rawAmount : (parseFloat(rawAmount) || 0);

      // Product
      const prodCol = columnMap['product'] || '';
      const prodRule = transformMap.get('product') || 'trim';
      const product = prodCol && row[prodCol]
        ? applyTransform(row[prodCol], prodRule)
        : (dept?.name || 'General Product');

      // Source
      const srcCol = columnMap['source'] || '';
      const srcRule = transformMap.get('source') || 'trim';
      const source = srcCol && row[srcCol]
        ? applyTransform(row[srcCol], srcRule)
        : 'Excel Import';

      // Remark
      const remCol = columnMap['remark'] || '';
      const remRule = transformMap.get('remark') || 'trim';
      const remark = remCol && row[remCol]
        ? applyTransform(row[remCol], remRule)
        : 'Imported via CSV/Excel';

      // Department resolution
      let assignedDeptId = departmentId;
      let assignedDeptName = dept?.name || 'General';
      const deptCol = columnMap['department'] || '';
      if (deptCol && row[deptCol]) {
        const fileDeptVal = String(row[deptCol]).trim().toLowerCase();
        const matchedDept = this.departments.find(
          d => d.name.toLowerCase() === fileDeptVal || d.code.toLowerCase() === fileDeptVal
        );
        if (matchedDept) {
          assignedDeptId = matchedDept.id;
          assignedDeptName = matchedDept.name;
        }
      }

      // Status resolution
      let initialStatus = 'Untouched';
      const prevStatusCol = columnMap['previous_status'] || '';
      if (prevStatusCol && row[prevStatusCol]) {
        const rawStat = String(row[prevStatusCol]).trim();
        if (rawStat) initialStatus = rawStat;
      }

      // Custom fields extraction
      const custom_fields: Record<string, any> = {};
      Object.entries(columnMap).forEach(([fKey, colHeader]) => {
        if (
          !['customer_name', 'mobile', 'alt_mobile', 'city', 'state', 'department', 'product', 'amount', 'source', 'previous_status', 'remark'].includes(fKey) &&
          colHeader &&
          row[colHeader] !== undefined
        ) {
          const rule = transformMap.get(fKey) || 'trim';
          custom_fields[fKey] = applyTransform(row[colHeader], rule);
        }
      });

      const lead: Lead = {
        id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        lead_code: leadCode,
        customer_name: cleanName,
        mobile: cleanMobile,
        alt_mobile: alt_mobile || undefined,
        city: city || undefined,
        state: state || undefined,
        department_id: assignedDeptId,
        department_name: assignedDeptName,
        product,
        amount,
        source,
        status: initialStatus,
        assigned_to: null, // Imported as Unassigned Leads per specification!
        assigned_to_name: null,
        remark,
        custom_fields: Object.keys(custom_fields).length > 0 ? custom_fields : undefined,
        created_at: new Date().toISOString(),
        assigned_at: null,
        last_activity_at: null,
      };

      newLeads.push(lead);
    });

    const supabase = getSupabase();
    if (supabase && newLeads.length > 0) {
      const { error: insErr } = await supabase.from('leads').insert(newLeads.map(l => ({
        id: l.id,
        lead_code: l.lead_code,
        customer_name: l.customer_name,
        mobile: l.mobile,
        alt_mobile: l.alt_mobile || null,
        city: l.city || null,
        state: l.state || null,
        department_id: l.department_id || null,
        product: l.product,
        amount: l.amount,
        source: l.source,
        status: l.status,
        assigned_to: null,
        remark: l.remark,
      })));

      if (insErr) {
        console.error('Failed to insert leads into Supabase:', insErr);
      }

      // Re-fetch all leads from Supabase (single source of truth)
      const { data: refreshedLeads } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (refreshedLeads) {
        this.leads = refreshedLeads;
      }
    } else {
      this.leads = [...newLeads, ...this.leads];
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
  public async updateLead(
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
  ): Promise<{ success: boolean; lead?: Lead; error?: string }> {
    const user = this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'User is not logged in.' };
    }

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

    const updatePayload: Record<string, any> = {
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

    const supabase = getSupabase();
    if (supabase) {
      const { error: leadErr } = await supabase.from('leads').update(updatePayload).eq('id', leadId);
      if (leadErr) {
        console.error('Failed to update lead in Supabase:', leadErr);
        return { success: false, error: leadErr.message };
      }

      // IMMUTABLE ACTIVITY HISTORY RECORD
      const actId = generateUUID();
      await supabase.from('lead_activities').insert([{
        id: actId,
        lead_id: leadId,
        user_id: user.id,
        user_name: user.full_name,
        status: updates.status,
        remark: updates.remark || 'Status updated',
        created_at: now,
      }]);

      // If followup / callback date is scheduled, insert into followups table
      if (updates.followup_date || updates.callback_date) {
        await supabase.from('followups').insert([{
          id: generateUUID(),
          lead_id: leadId,
          user_id: user.id,
          followup_type: updates.callback_date ? 'Call Back' : 'Follow-up',
          scheduled_at: updates.callback_date || updates.followup_date,
          status: 'Pending',
          remarks: updates.remark || '',
          created_at: now,
        }]);
      }

      // Re-fetch lead and activities from Supabase (single source of truth)
      const { data: refreshedLead } = await supabase.from('leads').select('*').eq('id', leadId).single();
      if (refreshedLead) {
        this.leads[index] = refreshedLead;
      }

      const { data: refreshedActs } = await supabase.from('lead_activities').select('*').order('created_at', { ascending: false });
      if (refreshedActs) {
        this.activities = refreshedActs;
      }

      return { success: true, lead: refreshedLead || this.leads[index] };
    }

    const updatedLead: Lead = {
      ...currentLead,
      ...updatePayload,
    };
    this.leads[index] = updatedLead;
    return { success: true, lead: updatedLead };
  }

  // --- MOBILE NUMBER UNLOCK TRACKING & AUDIT ---
  public async unlockLeadMobile(leadId: string): Promise<{ success: boolean; lead: Lead | null; unlockCount: number }> {
    const user = this.getCurrentUser();
    const index = this.leads.findIndex(l => l.id === leadId);
    if (index === -1) return { success: false, lead: null, unlockCount: 0 };

    const lead = this.leads[index];
    const newCount = (lead.mobile_unlock_count || 0) + 1;
    const now = new Date().toISOString();
    const userName = user ? user.full_name : 'Staff';
    const userId = user ? user.id : '00000000-0000-0000-0000-000000000000';

    const supabase = getSupabase();
    if (supabase) {
      const { error: updateErr } = await supabase.from('leads').update({
        mobile_unlock_count: newCount,
        mobile_unlocked_at: now,
        mobile_unlocked_by: userName,
      }).eq('id', leadId);

      if (updateErr) {
        console.warn('Unlock lead update error (will continue with audit):', updateErr);
      }

      // Record an audit activity
      const actId = generateUUID();
      await supabase.from('lead_activities').insert([{
        id: actId,
        lead_id: lead.id,
        user_id: userId,
        user_name: userName,
        status: lead.status,
        remark: `Mobile number unlocked by ${userName} (Unlock #${newCount})`,
        created_at: now,
      }]);

      const { data: refreshedLead } = await supabase.from('leads').select('*').eq('id', leadId).single();
      if (refreshedLead) {
        this.leads[index] = refreshedLead;
        return { success: true, lead: refreshedLead, unlockCount: refreshedLead.mobile_unlock_count || newCount };
      }
    }

    const updatedLead: Lead = {
      ...lead,
      mobile_unlock_count: newCount,
      mobile_unlocked_at: now,
      mobile_unlocked_by: userName,
    };
    this.leads[index] = updatedLead;
    return { success: true, lead: updatedLead, unlockCount: newCount };
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
    const targetUserId = (user && user.role === 'admin' && userId) ? userId : (user ? user.id : (userId || ''));

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
  public async resetToDefaults() {
    await this.clearAllData({ resetMasters: true });
    this.init();
  }
}

export const db = DatabaseService.getInstance();
