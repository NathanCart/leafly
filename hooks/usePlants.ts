// hooks/usePlants.ts
import { useS3Uploader } from '@/components/useS3Uploader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { PlantIdSuggestionRaw } from '@/types/plants';
import { Database } from '@/types/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useOfflineSync } from './useOfflineSync';

type Plant = Database['public']['Tables']['plants']['Row'];
const PLANTS_CACHE_KEY = '@plants_cache';

export function usePlants() {
	const { session } = useAuth();

	const { isOnline } = useOfflineSync();
	const [plants, setPlants] = useState<Plant[]>([]);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);

	// Initialize S3 uploader
	const BUCKET = process.env.EXPO_PUBLIC_BUCKET_NAME!;
	const { uploadFile, isUploading: isUploadingToS3 } = useS3Uploader(BUCKET);

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

	// Upload image via S3
	const uploadImage = async (uri: string): Promise<string> => {
		if (!session?.user.id) throw new Error('User not authenticated');
		setUploadProgress(0);
		if (uri.startsWith('http')) {
			setUploadProgress(100);
			return uri;
		}

		console.log('Uploading image to S3:', uri);

		try {
			const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
			const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
			const { url } = await uploadFile(uri, contentType);
			setUploadProgress(100);
			return url;
		} catch (e: any) {
			console.error('S3 upload error:', e);
			setUploadProgress(0);
			throw new Error(`Failed to upload image: ${e.message}`);
		}
	};

	const addPlant = async (
		plant: PlantIdSuggestionRaw & {
			nickname: string;
			lastWatered: Date;
			location: 'indoor' | 'outdoor';
			soil_type: string;
			pot_diameter: string;
			light_amount: string;
			last_watered: string;
		}
	) => {
		try {
			const imageUrl = plant.capturedImageUri
				? await uploadImage(plant.capturedImageUri)
				: plant?.details?.images?.[0];

			console.log(imageUrl, 'image url data datata');

			const raw = {
				...plant,
			};

			const response = await fetch(
				'https://kvjaxrtgtjbqopegbshw.supabase.co/functions/v1/get-plant-schedule',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({
						important_details: JSON.stringify({
							plant_name: plant?.name,
							soil_type: plant?.soil_type,
							pot_diameter: plant?.pot_diameter,
							light_amount: plant?.light_amount,
							indoor_or_outdoors: plant?.location,
						}),
						raw: JSON.stringify(raw),
					}),
				}
			).then((res) => res.json());

			console.log('Plant schedule response:', response);

			const { data, error } = await supabase
				.from('plants')
				.insert([
					{
						is_toxic_to_animals: response?.isToxicToAnimals,
						toxicity_description: response?.toxicityDescription,
						raw: plant,
						image_url: imageUrl,
						name: plant.name,
						nickname: plant.nickname,
						location: plant.location,
						user_id: session!.user.id,
						watering_interval_days: response?.waterFrequencyDays,
						fertilize_interval_days: response?.fertilizerFrequencyDays,
						watering_amount_ml: response?.waterMlPerWatering,
						watering_details: response?.wateringDescription,
						light_details: response?.lightDescription,
						soil_details: response?.soilDescription,
						soil_type: plant.soil_type,
						pot_diameter: plant.pot_diameter,
						light_amount: plant.light_amount,
						last_watered: plant.last_watered,
						last_fertilized: plant.last_watered,
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

	// inside updatePlant – replace the first few lines👇
	const updatePlant = async (id: string, updates: Partial<Plant>) => {
		try {
			/* ----------  NEW: normalise image_url  ---------- */
			if ('image_url' in updates) {
				// object from S3 hook → use its url
				if (updates.image_url && typeof updates.image_url === 'object') {
					// @ts-ignore because TS can't narrow this union cleanly
					updates.image_url = (updates.image_url as any).url as unknown as string;
				}
				// null → undefined so the later .startsWith guard is skipped
				if (updates.image_url == null) delete updates.image_url;
			}

			/* ---------- EXISTING logic (unchanged) ---------- */
			if (
				updates.image_url && // <-- now always a string
				!updates.image_url.startsWith('http')
			) {
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
			console.error('updatePlant error:', e);
			throw e;
		}
	};

	const deletePlant = async (id: string) => {
		try {
			await supabase.from('plants').delete().eq('id', id);
			await loadPlants();
		} catch (e) {
			console.error('deletePlant error:', e);
			throw e;
		}
	};

	const getPlantById = async (id: string): Promise<Plant | null> => {
		if (!session?.user.id) throw new Error('User not authenticated');
		if (isOnline) {
			const { data, error } = await supabase.from('plants').select('*').eq('id', id).single();
			if (error) throw error;
			return data;
		}
		return plants.find((p) => p.id === id) || null;
	};

	// Build watering & fertilizing schedule entries
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const entries: any[] = [];
	plants.forEach((plant) => {
		if (plant.watering_interval_days) {
			const last = plant.last_watered ? new Date(plant.last_watered) : today;
			const due = new Date(
				last.getTime() + plant.watering_interval_days * 24 * 60 * 60 * 1000
			);
			entries.push({
				id: `${plant.id}-water`,
				plantId: plant.id,
				plantName: plant.nickname,
				plantImage: !!plant?.image_url?.length
					? plant?.image_url
					: plant?.raw?.similar_images?.[0]?.url,
				type: 'Water',
				last: plant?.last_watered ?? new Date(),
				dueDate: due,
				amountMl: plant?.watering_amount_ml,
			});
		}
		if (plant.fertilize_interval_days) {
			const last = plant.last_fertilized ? new Date(plant.last_fertilized) : today;
			const due = new Date(
				last.getTime() + plant.fertilize_interval_days * 24 * 60 * 60 * 1000
			);
			entries.push({
				id: `${plant.id}-fertilize`,
				plantId: plant.id,
				plantName: plant.name,
				plantImage: !!plant?.image_url?.length
					? plant?.image_url
					: plant?.raw?.similar_images?.[0]?.url,
				type: 'Fertilize',
				dueDate: due,
				last: plant?.last_fertilized ?? new Date(),
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
		deletePlant,
		getPlantById,
		refreshPlants: loadPlants,
		isOnline,
		uploadProgress,
		isUploadingToS3,
		scheduleEntries: sortedEntries,
	};
}
