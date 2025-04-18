import { useCareSchedule } from '@/hooks/useCareSchedule';
import { Database } from '@/types/supabase';

export type CareSchedule = Database['public']['Tables']['care_schedule']['Row'];

export function useCareSchedules(plantId?: string) {
  const { schedules, loading, error, addSchedule, updateSchedule, deleteSchedule } = useCareSchedule(plantId);

  return {
    careSchedule: schedules,
    loading,
    error,
    addSchedule,
    updateSchedule,
    deleteSchedule
  };
}