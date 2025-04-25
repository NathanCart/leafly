import { PlantHealthReport, PlantIdClassificationResponse } from '@/types/plants';
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineSync } from './useOfflineSync';
import { usePlants } from './usePlants';

export function usePlantHealth() {
	const [identifying, setIdentifying] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [results, setResults] = useState<PlantHealthReport>();
	const { addPlant } = usePlants();
	const { session } = useAuth();
	const { isOnline } = useOfflineSync();

	const checkConnectivity = () => {
		if (!isOnline) throw new Error('No internet connection.');
	};

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

	return { identifying, error, results, identifyPlantHealth };
}
