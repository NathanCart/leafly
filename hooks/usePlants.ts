import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useOfflineSync } from './useOfflineSync';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';
import { PlantIdSuggestionRaw } from '@/types/plants';

type Plant = Database['public']['Tables']['plants']['Row'];
const PLANTS_CACHE_KEY = '@plants_cache';

export function usePlants() {
	const { session } = useAuth();
	const { isOnline } = useOfflineSync();
	const [plants, setPlants] = useState<Plant[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);

	// Load cache or fetch
	const loadPlants = async () => {
		if (!session?.user.id) {
			setLoading(false);
			return;
		}
		try {
			setLoading(true);
			setError(null);
			const cached = await AsyncStorage.getItem(PLANTS_CACHE_KEY);
			if (cached) setPlants(JSON.parse(cached));

			if (isOnline) {
				const { data, error } = await supabase
					.from('plants')
					.select('*')
					.eq('user_id', session.user.id)
					.order('created_at', { ascending: false });
				if (error) throw error;
				setPlants(data || []);
				await AsyncStorage.setItem(PLANTS_CACHE_KEY, JSON.stringify(data));
			}
		} catch (e) {
			console.error('Error loading plants:', e);
			setError(e instanceof Error ? e : new Error('Failed to load plants'));
		} finally {
			setLoading(false);
		}
	};

	// Real-time subscription
	useEffect(() => {
		if (!session?.user.id || !isOnline) return;
		loadPlants();
		const channel = supabase
			.channel(`plants:uid_${session.user.id}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'plants',
					filter: `user_id=eq.${session.user.id}`,
				},
				(payload) => {
					setPlants((prev) => {
						let updated = prev;
						if (payload.eventType === 'INSERT') {
							updated = [payload.new as Plant, ...prev];
						} else if (payload.eventType === 'UPDATE') {
							updated = prev.map((p) =>
								p.id === payload.new.id ? (payload.new as Plant) : p
							);
						} else if (payload.eventType === 'DELETE') {
							updated = prev.filter((p) => p.id !== payload.old.id);
						}
						AsyncStorage.setItem(PLANTS_CACHE_KEY, JSON.stringify(updated));
						return updated;
					});
				}
			)
			.subscribe();
		return () => supabase.removeChannel(channel);
	}, [session?.user.id, isOnline]);

	// Upload image helper
	const uploadImage = async (uri: string): Promise<string> => {
		if (!session?.user.id) throw new Error('User not authenticated');
		setUploadProgress(0);
		if (uri.startsWith('http')) {
			setUploadProgress(100);
			return uri;
		}
		const timestamp = Date.now();
		const rand = Math.random().toString(36).substring(7);
		const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
		const filename = `${timestamp}-${rand}.${ext}`;
		const path = `${session.user.id}/${filename}`;
		const opts: any = {
			contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
			cacheControl: '3600',
			upsert: false,
			metadata: {
				user_id: session.user.id,
				mime_type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
				filename,
				size: 0,
				created_at: new Date().toISOString(),
			},
		};
		try {
			let file: Blob | ArrayBuffer;
			if (Platform.OS === 'web') {
				const res = await fetch(uri);
				if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
				file = await res.blob();
				opts.metadata.size = (file as Blob).size;
			} else {
				let fileUri = uri.startsWith('file://')
					? uri
					: (await FileSystem.downloadAsync(uri, FileSystem.cacheDirectory + filename))
							.uri;
				const info = await FileSystem.getInfoAsync(fileUri);
				opts.metadata.size = info.size || 0;
				const b64 = await FileSystem.readAsStringAsync(fileUri, {
					encoding: FileSystem.EncodingType.Base64,
				});
				file = decode(b64);
				if (!uri.startsWith('file://'))
					await FileSystem.deleteAsync(fileUri, { idempotent: true });
			}
			const { data, error } = await supabase.storage.from('plants').upload(path, file, opts);
			if (error) throw error;
			if (!data?.path) throw new Error('No path returned');
			const { data: urlData } = supabase.storage.from('plants').getPublicUrl(path);
			setUploadProgress(100);
			return urlData.publicUrl;
		} catch (e: any) {
			console.error('Upload error:', e);
			setUploadProgress(0);
			throw new Error(`Failed to upload image: ${e.message}`);
		}
	};

	// CRUD operations
	const addPlant = async (plant: PlantIdSuggestionRaw & { nickname: string }) => {
		try {
			let imageUrl = plant.capturedImageUri
				? await uploadImage(plant.capturedImageUri)
				: undefined;
			const { data, error } = await supabase
				.from('plants')
				.insert([
					{
						raw: plant,
						image_url: imageUrl,
						name: plant.name,
						nickname: plant.nickname,
						location: plant.location,
						user_id: session!.user.id,
					},
				])
				.select()
				.single();
			if (error) throw error;
			await loadPlants();
			return data;
		} catch (e) {
			console.error('addPlant error:', e);
			throw e;
		}
	};

	const updatePlant = async (id: string, updates: Partial<Plant>) => {
		try {
			if (updates.image_url && !updates.image_url.startsWith('http'))
				updates.image_url = await uploadImage(updates.image_url);
			const { data, error } = await supabase
				.from('plants')
				.update({ ...updates, updated_at: new Date().toISOString() })
				.eq('id', id)
				.select()
				.single();
			if (error) throw error;
			await loadPlants();
			return data;
		} catch (e) {
			console.error('updatePlant error:', e);
			throw e;
		}
	};

	const deletePlant = async (id: string) => {
		try {
			const plant = plants.find((p) => p.id === id);
			if (plant?.image_url) {
				try {
					const url = new URL(plant.image_url);
					const fp = url.pathname.split('/').slice(-2).join('/');
					await supabase.storage.from('plants').remove([fp]);
				} catch {}
			}
			const { error } = await supabase.from('plants').delete().eq('id', id);
			if (error) throw error;
			await loadPlants();
		} catch (e) {
			console.error('deletePlant error:', e);
			throw e;
		}
	};

	const getPlantById = async (id: string): Promise<Plant | null> => {
		if (!session?.user.id) throw new Error('User not authenticated');
		try {
			if (isOnline) {
				const { data, error } = await supabase
					.from('plants')
					.select('*')
					.eq('id', id)
					.single();
				if (error) throw error;
				return data;
			}
			return plants.find((p) => p.id === id) || null;
		} catch (e) {
			console.error('getPlantById error:', e);
			throw e;
		}
	};

	// Prepare dates
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Build schedule entries for watering & fertilizing
	const entries: any[] = [];
	plants.forEach((plant) => {
		if (plant.watering_interval_days) {
			let due: Date;
			if (plant.last_watered) {
				const last = new Date(plant.last_watered);
				due = new Date(last.getTime() + plant.watering_interval_days * 24 * 60 * 60 * 1000);
			} else {
				due = new Date(today);
			}
			entries.push({
				id: `${plant.id}-water`,
				plantId: plant.id,
				plantName: plant.nickname,
				plantImage: plant.image_url,
				type: 'Water',
				dueDate: due,
			});
		}
		if (plant.fertilize_interval_days) {
			let due: Date;
			if (plant.last_fertilized) {
				const last = new Date(plant.last_fertilized);
				due = new Date(
					last.getTime() + plant.fertilize_interval_days * 24 * 60 * 60 * 1000
				);
			} else {
				due = new Date(today);
			}
			entries.push({
				id: `${plant.id}-fertilize`,
				plantId: plant.id,
				plantName: plant.name,
				plantImage: plant.image_url,
				type: 'Fertilize',
				dueDate: due,
			});
		}
	});

	const sortedEntries = entries.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

	return {
		plants,
		loading,
		error,
		addPlant,
		updatePlant,
		uploadImage,
		deletePlant,
		getPlantById,
		isOnline,
		uploadProgress,
		scheduleEntries: sortedEntries,
		refreshPlants: loadPlants,
	};
}
