import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useOfflineSync } from './useOfflineSync';

type Plant = Database['public']['Tables']['plants']['Row'];
const PLANTS_CACHE_KEY = '@plants_cache';

export function usePlants() {
  const { session } = useAuth();
  const { isOnline, queueChange } = useOfflineSync();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load plants from cache and then from server
  useEffect(() => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }

    async function loadCache() {
      try {
        const cached = await AsyncStorage.getItem(PLANTS_CACHE_KEY);
        if (cached) {
          setPlants(JSON.parse(cached));
        }
      } catch (e) {
        console.error('Error loading cached plants:', e);
      }
    }

    async function loadPlants() {
      try {
        const { data, error } = await supabase
          .from('plants')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPlants(data || []);
        await AsyncStorage.setItem(PLANTS_CACHE_KEY, JSON.stringify(data));
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to load plants'));
      } finally {
        setLoading(false);
      }
    }

    loadCache();
    if (isOnline) {
      loadPlants();
    } else {
      setLoading(false);
    }
  }, [session?.user.id, isOnline]);

  const addPlant = async (plant: Omit<Plant, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const newPlant = {
        ...plant,
        id: Math.random().toString(36).substring(7),
        user_id: session?.user.id!,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Update local state immediately
      setPlants(prev => [newPlant as Plant, ...prev]);
      await AsyncStorage.setItem(PLANTS_CACHE_KEY, JSON.stringify([newPlant, ...plants]));

      if (!isOnline) {
        await queueChange('plants', 'insert', newPlant);
      } else {
        const { data, error } = await supabase
          .from('plants')
          .insert([{ ...plant, user_id: session?.user.id }])
          .select()
          .single();

        if (error) throw error;
        setPlants(prev => prev.map(p => p.id === newPlant.id ? data : p));
        await AsyncStorage.setItem(PLANTS_CACHE_KEY, JSON.stringify(plants));
      }

      return newPlant;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to add plant');
    }
  };

  const updatePlant = async (id: string, updates: Partial<Plant>) => {
    try {
      const updatedPlant = {
        ...plants.find(p => p.id === id),
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Update local state immediately
      setPlants(prev => prev.map(p => p.id === id ? updatedPlant : p));
      await AsyncStorage.setItem(PLANTS_CACHE_KEY, JSON.stringify(plants));

      if (!isOnline) {
        await queueChange('plants', 'update', updatedPlant);
      } else {
        const { data, error } = await supabase
          .from('plants')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        setPlants(prev => prev.map(p => p.id === id ? data : p));
        await AsyncStorage.setItem(PLANTS_CACHE_KEY, JSON.stringify(plants));
      }

      return updatedPlant;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to update plant');
    }
  };

  const deletePlant = async (id: string) => {
    try {
      // Update local state immediately
      setPlants(prev => prev.filter(p => p.id !== id));
      await AsyncStorage.setItem(PLANTS_CACHE_KEY, JSON.stringify(plants.filter(p => p.id !== id)));

      if (!isOnline) {
        await queueChange('plants', 'delete', { id });
      } else {
        const { error } = await supabase
          .from('plants')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to delete plant');
    }
  };

  return { 
    plants, 
    loading, 
    error, 
    addPlant, 
    updatePlant, 
    deletePlant,
    isOnline 
  };
}