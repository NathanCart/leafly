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

	const loadPlants = async () => {
		if (!session?.user.id) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			// Try to load from cache first
			const cached = await AsyncStorage.getItem(PLANTS_CACHE_KEY);
			if (cached) {
				setPlants(JSON.parse(cached));
			}

			// If online, fetch fresh data
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

	useEffect(() => {
		loadPlants();
	}, [session?.user.id, isOnline]);

	const uploadImage = async (uri: string): Promise<string> => {
		if (!session?.user.id) {
			throw new Error('User not authenticated');
		}

		setUploadProgress(0);

		// If already a remote URL, return as is
		if (uri.startsWith('http')) {
			setUploadProgress(100);
			return uri;
		}

		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(7);
		const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
		const filename = `${timestamp}-${randomString}.${extension}`;
		const filePath = `${session.user.id}/${filename}`;

		const uploadOptions = {
			contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
			cacheControl: '3600',
			upsert: false,
			metadata: {
				user_id: session.user.id,
				mime_type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
				filename,
				size: 0,
				created_at: new Date().toISOString(),
			},
		};

		try {
			if (Platform.OS === 'web') {
				const response = await fetch(uri);
				if (!response.ok) {
					throw new Error(`Failed to fetch image: ${response.status}`);
				}
				const blob = await response.blob();
				uploadOptions.metadata.size = blob.size;

				const { data, error } = await supabase.storage
					.from('plants')
					.upload(filePath, blob, uploadOptions);

				if (error) throw error;
				if (!data?.path) throw new Error('Upload succeeded but no path returned');

				const { data: urlData } = supabase.storage.from('plants').getPublicUrl(filePath);

				setUploadProgress(100);
				return urlData.publicUrl;
			} else {
				let fileUri = uri;

				if (!uri.startsWith('file://')) {
					const downloadResult = await FileSystem.downloadAsync(
						uri,
						FileSystem.cacheDirectory + filename
					);
					fileUri = downloadResult.uri;
				}

				const fileInfo = await FileSystem.getInfoAsync(fileUri);
				uploadOptions.metadata.size = fileInfo.size ?? 0;

				const base64 = await FileSystem.readAsStringAsync(fileUri, {
					encoding: FileSystem.EncodingType.Base64,
				});

				const arrayBuffer = decode(base64);

				const { data, error } = await supabase.storage
					.from('plants')
					.upload(filePath, arrayBuffer, uploadOptions);

				if (error) throw error;
				if (!data?.path) throw new Error('Upload succeeded but no path returned');

				if (!uri.startsWith('file://')) {
					await FileSystem.deleteAsync(fileUri, { idempotent: true });
				}

				const { data: urlData } = supabase.storage.from('plants').getPublicUrl(filePath);

				setUploadProgress(100);
				return urlData.publicUrl;
			}
		} catch (err: any) {
			console.error('Upload error:', err);
			setUploadProgress(0);
			throw new Error(`Failed to upload image: ${err.message}`);
		}
	};

	const addPlant = async (plant: PlantIdSuggestionRaw & { nickname: string }) => {
		try {
			let imageUrl = plant.capturedImageUri;
			if (imageUrl) {
				imageUrl = await uploadImage(imageUrl);
			}

			console.log(plant.capturedImageUri, 'capturedImageUri data');

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

			if (error) {
				console.error('Error inserting plant:', error);
				throw error;
			}

			console.log('Plant added successfully:', data);

			await loadPlants();
			return data;
		} catch (e) {
			console.error('Error in addPlant:', e);
			throw e instanceof Error ? e : new Error('Failed to add plant');
		}
	};

	const updatePlant = async (id: string, updates: Partial<Plant>) => {
		try {
			if (updates.image_url && !updates.image_url.startsWith('http')) {
				updates.image_url = await uploadImage(updates.image_url);
			}

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
			throw e instanceof Error ? e : new Error('Failed to update plant');
		}
	};

	const deletePlant = async (id: string) => {
		try {
			const plant = plants.find((p) => p.id === id);
			if (plant?.image_url) {
				try {
					const url = new URL(plant.image_url);
					const filePath = url.pathname.split('/').slice(-2).join('/');
					await supabase.storage.from('plants').remove([filePath]);
				} catch (err) {
					console.warn('Failed to delete image from storage:', err);
				}
			}

			const { error } = await supabase.from('plants').delete().eq('id', id);

			if (error) throw error;

			await loadPlants();
		} catch (e) {
			throw e instanceof Error ? e : new Error('Failed to delete plant');
		}
	};

	// New: fetch a single plant by its ID
	const getPlantById = async (id: string): Promise<Plant | null> => {
		if (!session?.user.id) {
			throw new Error('User not authenticated');
		}
		try {
			if (isOnline) {
				const { data, error } = await supabase
					.from('plants')
					.select('*')
					.eq('id', id)
					.single();
				if (error) throw error;
				return data;
			} else {
				// Fallback to local cache
				return plants.find((p) => p.id === id) || null;
			}
		} catch (e) {
			console.error('Error fetching plant by id:', e);
			throw e instanceof Error ? e : new Error('Failed to get plant');
		}
	};

	return {
		plants,
		loading,
		error,
		addPlant,
		updatePlant,
		deletePlant,
		getPlantById, // ← exported here
		isOnline,
		uploadProgress,
		refreshPlants: loadPlants,
	};
}
