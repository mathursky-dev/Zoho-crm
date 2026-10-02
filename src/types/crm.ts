export type UserRole = 'admin' | 'telecaller';

export interface Profile {
  id: string; // Valid UUID matching auth.users(id)
  email: string;
  full_name: string;
  role: UserRole;
  username?: string;
  password?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface LeadStatus {
  id: string;
  name: string;
  color: string; // hex or tailwind badge color
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export type StandardLeadStatus =
  | 'Untouched'
  | 'Contacted'
  | 'Follow-up'
  | 'Call Back'
  | 'Interested'
  | 'Hot Lead'
  | 'Order Placed'
  | 'Payment Pending'
  | 'Money Problem'
  | 'Thinking/Discussing'
  | 'No Answer'
  | 'Busy'
  | 'Switch Off/Unreachable'
  | 'Not Interested'
  | 'Wrong Number'
  | 'Duplicate'
  | 'Do Not Call'
  | 'Converted/Completed'
  | 'Converted';

export interface Lead {
  id: string;
  company_id?: string;
  lead_code: string; // e.g. LEAD-1001
  customer_name: string;
  mobile: string;
  alt_mobile?: string;
  city?: string;
  state?: string;
  department_id?: string | null;
  department_name?: string;
  product: string;
  amount: number;
  source: string; // e.g. "Website", "Facebook", "Referral", "Excel Import"
  status_id?: string;
  status: StandardLeadStatus | string;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  remark?: string;
  followup_date?: string | null; // ISO or date string
  callback_date?: string | null;
  created_at: string;
  assigned_at?: string | null;
  last_activity_at?: string | null;
  
  // Custom fields dictionary
  custom_fields?: Record<string, any>;

  // Mobile number unlocking tracking & audit
  mobile_unlock_count?: number;
  mobile_unlocked_at?: string | null;
  mobile_unlocked_by?: string | null;

  // Order placed extra details
  order_amount?: number | null;
  order_product?: string | null;
  order_quantity?: number | null;
  payment_status?: 'Pending' | 'Paid' | 'Partial' | 'COD' | null;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  user_name: string;
  status: string;
  remark: string;
  created_at: string;
}

export interface LeadAssignment {
  id: string;
  lead_id: string;
  previous_user_id?: string | null;
  assigned_to: string;
  assigned_by: string;
  department_id?: string;
  assigned_at?: string;
  created_at: string;
}

export interface Followup {
  id: string;
  lead_id: string;
  lead_code?: string;
  customer_name?: string;
  mobile?: string;
  user_id: string;
  followup_type: 'Follow-up' | 'Call Back';
  scheduled_at: string;
  status: 'Pending' | 'Completed' | 'Overdue' | 'Cancelled';
  remarks?: string;
  created_at: string;
}

export type FieldDataType =
  | 'text'
  | 'number'
  | 'phone'
  | 'email'
  | 'select'
  | 'date'
  | 'currency'
  | 'textarea'
  | 'boolean';

export interface FieldMasterItem {
  id: string;
  field_key: string; // unique identifier, e.g. 'customer_name', 'mobile', 'pan_number'
  field_label: string; // user-friendly label, e.g. 'Customer Name', 'Mobile Number'
  data_type: FieldDataType;
  is_required: boolean;
  is_system: boolean; // system fields cannot be deleted or have their key renamed
  is_active: boolean;
  department_id?: string; // empty/undefined = All Departments
  department_name?: string;
  placeholder?: string;
  default_value?: string;
  options?: string[]; // options for 'select' dropdown
  show_in_table: boolean; // display in All Leads / Lead Pool table
  show_in_form: boolean; // display in detail / update form
  show_in_template: boolean; // include in Sample Excel/CSV template
  display_order: number;
  created_at: string;
  updated_at?: string;
}

export type TransformRule =
  | 'none'
  | 'trim'
  | 'digits_only'
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'currency_to_number';

export interface ImportFieldMappingItem {
  id: string;
  field_key: string; // foreign key matching FieldMasterItem.field_key
  target_field_label: string; // target field name
  is_required: boolean;
  aliases: string[]; // variations of column headers in imported files
  default_value?: string; // fallback value if empty
  transform_rule: TransformRule;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LeadImportRow {
  customer_name: string;
  mobile: string;
  alt_mobile?: string;
  city?: string;
  state?: string;
  product?: string;
  amount?: number;
  source?: string;
  remark?: string;
  custom_fields?: Record<string, any>;
  [key: string]: any;
}
