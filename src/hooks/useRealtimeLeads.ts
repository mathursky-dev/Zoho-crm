import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeLeads(
  companyId: string,
  refreshLeads: () => void
) {
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`leads-company-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          refreshLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, refreshLeads]);
}
