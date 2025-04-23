import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useProfile() {
	const { session } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const loadProfile = async () => {
		if (!session?.user.id) {
			setLoading(false);
			return;
		}

		try {
			const { data: existingProfile, error: fetchError } = await supabase
				.from('profiles')
				.select('id, username, updated_at, email, avatar_url')
				.eq('id', session?.user.id)
				.maybeSingle();

			if (fetchError && fetchError.code !== 'PGRST116') {
				throw fetchError;
			}

			if (!existingProfile) {
				// Create new profile if none exists
				const { data: newProfile, error: createError } = await supabase
					.from('profiles')
					.insert([
						{
							id: session?.user.id,
							username: null,
							updated_at: new Date().toISOString(),
						},
					])
					.select()
					.single();

				if (createError) throw createError;
				setProfile(newProfile);
			} else {
				setProfile(existingProfile);
			}
		} catch (e) {
			setError(e instanceof Error ? e : new Error('Failed to load profile'));
		} finally {
			setLoading(false);
		}
	};

	// Load profile on mount and when session changes
	useEffect(() => {
		loadProfile();
	}, [session?.user.id]);

	// Set up real-time subscription
	useEffect(() => {
		if (!session?.user.id) return;

		const channel = supabase
			.channel(`profile:${session.user.id}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'profiles',
					filter: `id=eq.${session.user.id}`,
				},
				(payload) => {
					if (payload.eventType === 'UPDATE') {
						setProfile(payload.new as Profile);
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [session?.user.id]);

	const updateProfile = async (updates: Partial<Profile>) => {
		try {
			const { error } = await supabase
				.from('profiles')
				.update({
					...updates,
					updated_at: new Date().toISOString(),
				})
				.eq('id', session?.user.id);

			if (error) throw error;

			// Immediately update local state
			setProfile((prev) => (prev ? { ...prev, ...updates } : null));

			// Refresh profile data from server
			await loadProfile();
		} catch (e) {
			throw e instanceof Error ? e : new Error('Failed to update profile');
		}
	};

	return { profile, loading, error, updateProfile, refreshProfile: loadProfile };
}
