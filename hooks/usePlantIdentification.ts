import { usePlants } from '@/contexts/DatabaseContext';
import { PlantIdClassificationResponse } from '@/types/plants';
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineSync } from './useOfflineSync';

export function usePlantIdentification() {
	const [identifying, setIdentifying] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [results, setResults] = useState<PlantIdClassificationResponse>([]);
	const { addPlant } = usePlants();
	const { session } = useAuth();
	const { isOnline } = useOfflineSync();

	const checkConnectivity = () => {
		if (!isOnline) throw new Error('No internet connection.');
	};

	const determineLocation = (
		family: string,
		description: string,
		commonNames: string[],
		lightReq?: string
	): 'Indoor' | 'Outdoor' => {
		const fam = family.toLowerCase();
		if (
			[
				'araceae',
				'marantaceae',
				'asparagaceae',
				'arecaceae',
				'moraceae',
				'polypodiaceae',
				'orchidaceae',
				'begoniaceae',
				'gesneriaceae',
				'acanthaceae',
			].some((f) => fam.includes(f))
		)
			return 'Indoor';

		const text = `${description} ${commonNames.join(' ')} ${lightReq || ''}`.toLowerCase();
		if (
			['low light', 'shade', 'indirect light', 'filtered light', 'partial shade'].some((k) =>
				text.includes(k)
			)
		)
			return 'Indoor';

		if (
			commonNames.some((n) =>
				['houseplant', 'indoor', 'house plant'].some((w) => n.toLowerCase().includes(w))
			)
		)
			return 'Indoor';

		return 'Outdoor';
	};

	const getPlantById = async (accessToken: string) => {
		try {
			checkConnectivity();

			const detailKeys = [
				'common_names',
				'url',
				'description',
				'taxonomy',
				'rank',
				'gbif_id',
				'inaturalist_id',
				'image',
				'synonyms',
				'edible_parts',
				'watering',
				'propagation_methods',
			].join(',');

			const url = `https://plant.id/api/v3/kb/plants/${accessToken}?details=${detailKeys}&language=en`;

			const response = await fetch(url, {
				headers: {
					'Api-Key': process.env.EXPO_PUBLIC_PLANT_ID_KEY!,
				},
			});

			if (!response.ok) {
				const txt = await response.text();
				console.error('Error fetching plant by access token:', response.status, txt);
				throw new Error(`Failed to fetch plant (${response.status}): ${txt}`);
			}

			const data = await response.json();
			console.log('Fetched plant by token:', data);
			return data;
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to fetch plant by token';
			setError(msg);
			throw new Error(msg);
		}
	};

	const identifyPlant = async (imageUri: string): Promise<PlantIdClassificationResponse> => {
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
				'common_names',
				'url',
				'description',
				'taxonomy',
				'rank',
				'gbif_id',
				'inaturalist_id',
				'image',
				'images',
				'edible_parts',
				'propagation_methods',
				'watering',
				'best_watering',
				'best_light_condition',
				'best_soil_type',
				'common_uses',
				'toxicity',
				'cultural_significance',
			].join(',');

			const url = `https://plant.id/api/v3/identification?details=${detailKeys}&language=en`;
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

			console.log('Plant.ID response', data.result?.classification?.suggestions?.[0]);
			const suggestions = (data.result?.classification?.suggestions ||
				[]) as PlantIdClassificationResponse;
			if (suggestions.length === 0) throw new Error('No plant matches found');

			const plantResults = suggestions?.map?.((result) => {
				const plantLocation = determineLocation(
					result.details?.taxonomy?.family || '',
					result.details?.description?.value || '',
					result.details?.common_names || [],
					result.details?.best_light_condition
				);

				return {
					...result,
					capturedImageUri: imageUri,
					location: plantLocation,
				};
			});

			setResults(plantResults);
			return plantResults;
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to identify plant';
			setError(msg);
			throw new Error(msg);
		} finally {
			setIdentifying(false);
		}
	};

	const saveIdentifiedPlant = async (r: PlantIdClassificationResponse) => {
		// unchanged
		return addPlant({
			nickname: r.name,
			...r,
		});
	};

	return { identifying, error, results, identifyPlant, saveIdentifiedPlant, getPlantById };
}
