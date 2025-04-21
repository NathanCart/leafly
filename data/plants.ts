import { usePlants } from '@/hooks/usePlants';
import { Database } from '@/types/supabase';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type Plant = Database['public']['Tables']['plants']['Row'];

export function useMyPlants() {
	const { plants, loading, error, addPlant, updatePlant, deletePlant, isOnline, refreshPlants } =
		usePlants();
	const { session } = useAuth();

	useEffect(() => {
		if (!session?.user.id) return;

		// Subscribe to realtime changes
		const channel = supabase
			.channel('plants_changes')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'plants',
					filter: `user_id=eq.${session.user.id}`,
				},
				() => {
					// Refresh plants when any change occurs
					refreshPlants();
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [session?.user.id]);

	return {
		myPlants: plants,
		loading,
		error,
		addPlant,
		updatePlant,
		deletePlant,
		isOnline,
		refreshPlants,
	};
}
