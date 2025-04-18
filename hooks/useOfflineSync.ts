import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const OFFLINE_QUEUE_KEY = '@offline_queue';

type QueueItem = {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
};

export function useOfflineSync() {
  const { session } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      if (state.isConnected) {
        syncOfflineChanges();
      }
    });

    return () => unsubscribe();
  }, [session?.user.id]);

  // Queue offline changes
  const queueChange = async (
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any
  ) => {
    try {
      const queueItem: QueueItem = {
        id: Math.random().toString(36).substring(7),
        table,
        operation,
        data,
        timestamp: Date.now(),
      };

      const queue = await getQueue();
      queue.push(queueItem);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

      return queueItem.id;
    } catch (error) {
      console.error('Error queueing offline change:', error);
      throw error;
    }
  };

  // Get offline queue
  const getQueue = async (): Promise<QueueItem[]> => {
    try {
      const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  };

  // Sync offline changes
  const syncOfflineChanges = async () => {
    if (!session?.user.id || isSyncing) return;

    try {
      setIsSyncing(true);
      const queue = await getQueue();
      if (queue.length === 0) return;

      for (const item of queue) {
        try {
          switch (item.operation) {
            case 'insert':
              await supabase.from(item.table).insert(item.data);
              break;
            case 'update':
              await supabase
                .from(item.table)
                .update(item.data)
                .eq('id', item.data.id);
              break;
            case 'delete':
              await supabase
                .from(item.table)
                .delete()
                .eq('id', item.data.id);
              break;
          }
        } catch (error) {
          console.error(`Error syncing ${item.operation} for ${item.table}:`, error);
        }
      }

      // Clear the queue after successful sync
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('Error syncing offline changes:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    isSyncing,
    queueChange,
    syncOfflineChanges,
  };
}