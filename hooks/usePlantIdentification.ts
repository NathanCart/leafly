import { useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { usePlants } from './usePlants';
import { useOfflineSync } from './useOfflineSync';

interface PlantIdentificationResult {
  name: string;
  scientificName: string;
  confidence: number;
  description: string;
  imageUri: string;
  capturedImageUri?: string;
  similarImages: string[];
  family: string;
  commonNames: string[];
  location: 'Indoor' | 'Outdoor';
  careInstructions?: {
    light?: string;
    water?: string;
    soil?: string;
    temperature?: string;
    humidity?: string;
  };
}

// Common indoor plant families
const INDOOR_PLANT_FAMILIES = [
  'araceae',        // Philodendrons, Pothos, Peace Lilies
  'marantaceae',    // Prayer Plants
  'asparagaceae',   // Snake Plants
  'arecaceae',      // Indoor Palms
  'moraceae',       // Ficus
  'polypodiaceae',  // Ferns
  'orchidaceae',    // Orchids
  'begoniaceae',    // Begonias
  'gesneriaceae',   // African Violets
  'acanthaceae',    // Persian Shield
];

// Light requirement keywords that suggest indoor plants
const INDOOR_LIGHT_KEYWORDS = [
  'low light',
  'shade',
  'indirect light',
  'filtered light',
  'partial shade',
];

export function usePlantIdentification() {
  const [identifying, setIdentifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PlantIdentificationResult[]>([]);
  const { addPlant } = usePlants();
  const { session } = useAuth();
  const { isOnline } = useOfflineSync();

  const checkConnectivity = () => {
    if (!isOnline) {
      throw new Error('No internet connection. Please check your connection and try again.');
    }
  };

  const determineLocation = (
    family: string,
    description: string,
    commonNames: string[],
    lightRequirements?: string
  ): 'Indoor' | 'Outdoor' => {
    // Check if plant family is commonly grown indoors
    const familyLower = family.toLowerCase();
    if (INDOOR_PLANT_FAMILIES.some(f => familyLower.includes(f))) {
      return 'Indoor';
    }

    // Check description, common names, and light requirements for indoor indicators
    const fullText = `${description} ${commonNames.join(' ')} ${lightRequirements || ''}`.toLowerCase();
    
    if (INDOOR_LIGHT_KEYWORDS.some(keyword => fullText.includes(keyword))) {
      return 'Indoor';
    }

    // Check for specific indoor plant indicators in common names
    const isCommonIndoorPlant = commonNames.some(name => 
      name.toLowerCase().includes('houseplant') ||
      name.toLowerCase().includes('indoor') ||
      name.toLowerCase().includes('house plant')
    );

    if (isCommonIndoorPlant) {
      return 'Indoor';
    }

    // Default to outdoor if no indoor indicators are found
    return 'Outdoor';
  };

  const identifyPlant = async (imageUri: string): Promise<PlantIdentificationResult[]> => {
    try {
      setIdentifying(true);
      setError(null);
      checkConnectivity();

      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Call Plant.id API
      const identificationResult = await fetch('https://api.plant.id/v2/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': process.env.EXPO_PUBLIC_PLANT_ID_KEY!
        },
        body: JSON.stringify({
          images: [base64Image],
          modifiers: ["similar_images"],
          plant_details: ["common_names", "url", "wiki_description", "taxonomy", "synonyms"],
          plant_language: "en",
          no_redirect: true
        })
      });

      if (!identificationResult.ok) {
        throw new Error('Failed to identify plant from image');
      }

      const data = await identificationResult.json();

      if (!data.suggestions?.length) {
        throw new Error('No plant matches found');
      }

      const plantResults = data.suggestions
        .slice(0, 5)
        .map(suggestion => {
          const plantDetails = suggestion.plant_details;
          const location = determineLocation(
            plantDetails?.taxonomy?.family || '',
            plantDetails?.wiki_description?.value || '',
            plantDetails?.common_names || [],
            suggestion.plant_details?.care_instructions?.light
          );
          
          return {
            name: suggestion.plant_name,
            scientificName: plantDetails?.scientific_name || suggestion.plant_name,
            confidence: suggestion.probability,
            description: plantDetails?.wiki_description?.value || 'No description available',
            imageUri: suggestion.similar_images?.[0]?.url || imageUri,
            capturedImageUri: imageUri,
            similarImages: (suggestion.similar_images || [])
              .map(img => img.url)
              .filter(url => 
                url && 
                url.startsWith('https://') && 
                !url.includes('invalid') && 
                !url.includes('placeholder')
              ),
            family: plantDetails?.taxonomy?.family || 'Unknown family',
            commonNames: plantDetails?.common_names || [suggestion.plant_name],
            location,
            careInstructions: {
              light: location === 'Indoor' ? 'Moderate to bright indirect light' : 'Full to partial sun',
              water: 'Water when top inch of soil is dry',
              soil: 'Well-draining potting mix',
              temperature: location === 'Indoor' ? '65-80°F (18-27°C)' : '60-85°F (15-29°C)',
              humidity: location === 'Indoor' ? 'Moderate to high' : 'Varies by climate'
            }
          };
        });

      setResults(plantResults);
      return plantResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to identify plant';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIdentifying(false);
    }
  };

  const saveIdentifiedPlant = async (identificationResult: PlantIdentificationResult) => {
    try {
      if (!identificationResult?.name) {
        throw new Error('Invalid plant identification result');
      }

      const imageToUse = identificationResult.capturedImageUri;
      if (!imageToUse) {
        throw new Error('No captured image available');
      }

      const newPlant = await addPlant({
        name: identificationResult.scientificName || identificationResult.name,
        nickname: identificationResult.name,
        image_url: imageToUse,
        location: identificationResult.location,
        health_status: 'Healthy',
        notes: identificationResult.description,
        is_favorite: false
      });

      return newPlant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save plant';
      throw new Error(message);
    }
  };

  return {
    identifying,
    error,
    results,
    identifyPlant,
    saveIdentifiedPlant
  };
}