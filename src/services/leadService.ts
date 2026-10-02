import { supabase } from '../lib/supabase';

export async function getLeads(companyId: string) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createLead(lead: any) {
  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLead(id: string, updates: any) {
  const { data, error } = await supabase
    .from('leads')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLead(id: string) {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function assignLead(
  leadId: string,
  userId: string
) {
  return updateLead(leadId, {
    assigned_to: userId,
  });
}

export async function updateLeadStatus(
  leadId: string,
  statusId: string
) {
  return updateLead(leadId, {
    status_id: statusId,
  });
}
