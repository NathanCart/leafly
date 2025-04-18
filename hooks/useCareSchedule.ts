import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';

type CareSchedule = Database['public']['Tables']['care_schedule']['Row'];

export function useCareSchedule(plantId?: string) {
  const { session } = useAuth();
  const [schedules, setSchedules] = useState<CareSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }

    async function loadSchedules() {
      try {
        let query = supabase
          .from('care_schedule')
          .select('*, plants!inner(*)')
          .eq('plants.user_id', session.user.id);

        if (plantId) {
          query = query.eq('plant_id', plantId);
        }

        const { data, error } = await query.order('scheduled_date', { ascending: true });

        if (error) throw error;
        setSchedules(data || []);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to load care schedules'));
      } finally {
        setLoading(false);
      }
    }

    loadSchedules();
  }, [session?.user.id, plantId]);

  const addSchedule = async (schedule: Omit<CareSchedule, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('care_schedule')
        .insert([schedule])
        .select()
        .single();

      if (error) throw error;
      setSchedules(prev => [...prev, data]);
      return data;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to add care schedule');
    }
  };

  const updateSchedule = async (id: string, updates: Partial<CareSchedule>) => {
    try {
      const { data, error } = await supabase
        .from('care_schedule')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setSchedules(prev => prev.map(s => s.id === id ? data : s));
      return data;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to update care schedule');
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('care_schedule')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to delete care schedule');
    }
  };

  return { schedules, loading, error, addSchedule, updateSchedule, deleteSchedule };
}