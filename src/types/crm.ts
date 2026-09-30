export type UserRole = 'admin' | 'telecaller';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id?: string;
  department_name?: string;
  is_active: boolean;
  phone?: string;
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

export interface UserDepartment {
  id: string;
  user_id: string;
  department_id: string;
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
  | 'No Answer'
  | 'Busy'
  | 'Not Interested'
  | 'Wrong Number'
  | 'Converted';

export interface Lead {
  id: string;
  lead_code: string; // e.g. LEAD-1001
  customer_name: string;
  mobile: string;
  alt_mobile?: string;
  city?: string;
  state?: string;
  department_id: string;
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
  assigned_by: string;
  assigned_to: string;
  department_id: string;
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
  [key: string]: any;
}
