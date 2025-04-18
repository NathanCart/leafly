import { usePlants } from '@/hooks/usePlants';
import { Database } from '@/types/supabase';

export type Plant = Database['public']['Tables']['plants']['Row'];

export function useMyPlants() {
  const { plants = [], loading, error, addPlant, updatePlant, deletePlant, isOnline } = usePlants();

  return {
    myPlants: plants,
    loading,
    error,
    addPlant,
    updatePlant,
    deletePlant,
    isOnline
  };
}