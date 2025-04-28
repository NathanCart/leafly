import { useS3Uploader } from '@/components/useS3Uploader';
import { supabase } from '@/lib/supabase';
import { PlantHealthReport } from '@/types/plants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineSync } from './useOfflineSync';
import { usePlantImages } from './usePlantImages';
import { Database } from '@/types/supabase';
import { useIsFocused } from '@react-navigation/native';

export function usePlantHealth(plantId: string | null) {
	const [identifying, setIdentifying] = useState(false);
	const [error, setError] = useState<any>(null);
	const [results, setResults] = useState<PlantHealthReport>();
	const { session } = useAuth();
	const { isOnline } = useOfflineSync();
	const { addImage } = usePlantImages(plantId ?? '');
	const isFocused = useIsFocused(); // 👈 add

	const [healthReports, setHealthReports] = useState<
		Database['public']['Tables']['plant_health_reports']['Row'][]
	>([]);
	const [loading, setLoading] = useState(false);
	const BUCKET = process.env.EXPO_PUBLIC_BUCKET_NAME!;
	const { uploadFile, isUploading: isUploadingToS3, error: uploadError } = useS3Uploader(BUCKET);

	const PLANTS_CACHE_KEY = '@plant_health_reports_cache';

	const checkConnectivity = () => {
		if (!isOnline) throw new Error('No internet connection.');
	};

	const loadPlants = async () => {
		if (!session?.user.id) {
			setLoading(false);
			return;
		}
		try {
			setLoading(true);
			setError(null);
			const cached = await AsyncStorage.getItem(PLANTS_CACHE_KEY);
			if (!!cached?.length) setHealthReports(JSON.parse(cached));

			if (isOnline) {
				const { data, error } = await supabase
					.from('plant_health_reports')
					.select('*')
					.eq('plant_id', plantId)
					.order('created_at', { ascending: false });

				console.log('found report data', data);
				if (error) throw error;
				setHealthReports(data || []);
				await AsyncStorage.setItem(PLANTS_CACHE_KEY, JSON.stringify(data));
			}
		} catch (e) {
			console.error('Error loading plants:', e);
			setError(e instanceof Error ? e : new Error('Failed to load plant health reports'));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!session?.user.id || !isOnline) return;
		loadPlants();
		const channel = supabase
			.channel(`plant_health_reports:uid_${session.user.id}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'plants',
					filter: `plant_id=eq.${plantId}`,
				},
				(payload) => {
					setHealthReports((prev) => {
						let updated = prev;
						if (payload.eventType === 'INSERT') {
							updated = [payload.new as PlantHealthReport, ...prev];
						} else if (payload.eventType === 'UPDATE') {
							updated = prev.map((p) =>
								p.id === payload.new.id ? (payload.new as PlantHealthReport) : p
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
	}, [session?.user.id, isOnline, isFocused]);

	console.log(healthReports?.length, 'healthReports data');

	const identifyPlantHealth = async (imageUri: string): Promise<PlantHealthReport> => {
		try {
			setIdentifying(true);
			setError(null);
			checkConnectivity();

			// read image as base64
			const base64Image = await FileSystem.readAsStringAsync(imageUri, {
				encoding: FileSystem.EncodingType.Base64,
			});

			// build details query
			const detailKeys = [
				'local_name',
				'description',
				'url',
				'treatment',
				'classification',
				'common_names',
				'cause',
			].join(',');

			const url = `https://plant.id/api/v3/health_assessment?details=${detailKeys}&language=en&full_disease_list=true&health=only`;
			const identificationResult = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Api-Key': process.env.EXPO_PUBLIC_PLANT_ID_KEY!,
				},
				body: JSON.stringify({
					images: [base64Image],
					similar_images: true,
				}),
			});

			if (!identificationResult.ok) {
				const txt = await identificationResult.text();
				console.error('Plant.ID error', identificationResult.status, txt);
				throw new Error(`Plant.ID error ${identificationResult.status}: ${txt}`);
			}

			const data = await identificationResult.json();

			// Upload image to S3
			const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
			const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
			const { url: plantImage } = await uploadFile(imageUri, contentType);

			await addPlantHealthReport(plantId!, plantImage, data);

			setResults(data);
			return data;
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to identify plant';
			setError(msg);
			throw new Error(msg);
		} finally {
			setIdentifying(false);
		}
	};

	const addPlantHealthReport = async (
		plantId: string,
		imageUrl: string,
		raw: PlantHealthReport
	) => {
		try {
			console.log(plantId, imageUrl, raw, 'addPlantHealthReport');
			if (!!plantId?.length) {
				await addImage(imageUrl, 'Plant health report image.');
			}

			const { data, error } = await supabase
				.from('plant_health_reports')
				.insert([
					{
						raw: raw,
						image_url: imageUrl,
						user_id: session!.user.id,
						plant_id: plantId,
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

	return { identifying, error, results, identifyPlantHealth, healthReports };
}
