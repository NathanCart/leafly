import { useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { usePlants } from './usePlants';
import { useOfflineSync } from './useOfflineSync';

interface PlantIdentificationResult {
  name: string;
  scientificName: string;
  confidence: number;
  labels: Array<{ name: string; confidence: number }>;
  description: string;
  imageUri: string;
}

export function usePlantIdentification() {
  const [identifying, setIdentifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addPlant } = usePlants();
  const { session } = useAuth();
  const { isOnline } = useOfflineSync();

  const checkConnectivity = () => {
    if (!isOnline) {
      throw new Error('No internet connection. Please check your connection and try again.');
    }
  };

  const resizeImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > 1024) {
          height = Math.floor(height * (1024 / width));
          width = 1024;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/jpeg', 0.8);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const identifyPlant = async (imageUri: string): Promise<PlantIdentificationResult> => {
    try {
      setIdentifying(true);
      setError(null);
      checkConnectivity();

      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY;
      if (!apiKey) {
        throw new Error('Google Cloud API key is not configured');
      }

      let processedImageUri = imageUri;

      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const file = new File([blob], 'plant.jpg', { type: 'image/jpeg' });
        processedImageUri = await resizeImage(file);
      }

      const response = await fetch(processedImageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const base64Data = base64.split(',')[1];

      const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Data },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 15 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
              { type: 'WEB_DETECTION', maxResults: 10 }
            ]
          }]
        })
      });

      if (!visionResponse.ok) {
        const errorData = await visionResponse.json();
        console.error('Vision API Error:', errorData);
        throw new Error(`Failed to analyze image: ${errorData?.error?.message || 'Unknown error'}`);
      }

      const visionData = await visionResponse.json();
      const labels = visionData.responses[0]?.labelAnnotations || [];
      const webEntities = visionData.responses[0]?.webDetection?.webEntities || [];
      const bestGuessLabel = visionData.responses[0]?.webDetection?.bestGuessLabels?.[0]?.label || '';

      const plantLabels = labels.filter(label => {
        const desc = label.description.toLowerCase();
        return (
          desc.includes('plant') || desc.includes('flower') || desc.includes('tree') ||
          desc.includes('succulent') || desc.includes('herb') || desc.includes('fern') ||
          desc.includes('palm') || desc.includes('orchid') || desc.includes('cactus')
        ) && !desc.includes('pot') && !desc.includes('vase');
      });

      const plantEntities = webEntities.filter(entity => {
        const desc = entity.description?.toLowerCase() || '';
        return (
          desc.includes('plant') || desc.includes('flower') || desc.includes('tree') ||
          desc.includes('succulent') || desc.includes('herb') || desc.includes('fern') ||
          desc.includes('palm') || desc.includes('orchid') || desc.includes('cactus')
        ) && !desc.includes('pot') && !desc.includes('vase');
      });

      if (plantLabels.length === 0 && plantEntities.length === 0 && !bestGuessLabel) {
        throw new Error('No specific plant type detected in image');
      }

      const allDetections = [
        ...plantLabels.map(l => ({ name: l.description, confidence: l.score })),
        ...plantEntities.map(e => ({ name: e.description, confidence: e.score }))
      ].sort((a, b) => b.confidence - a.confidence);

      const bestMatch = allDetections[0] || { name: bestGuessLabel, confidence: 0.6 };

      let scientificName = '';
      const scientificEntity = plantEntities.find(e => /\((.*?)\)/.test(e.description));
      if (scientificEntity) {
        scientificName = scientificEntity.description;
      } else {
        const wikiEntity = webEntities.find(e =>
          e.description && e.entityId?.includes('/m/') && e.score > 0.6
        );
        if (wikiEntity) {
          scientificName = wikiEntity.description;
        } else {
          scientificName = bestGuessLabel || bestMatch.name;
        }
      }

      const relatedLabels = labels
        .filter(label =>
          label.description.toLowerCase() !== bestMatch.name.toLowerCase() &&
          (label.description.toLowerCase().includes('leaf') ||
            label.description.toLowerCase().includes('flower') ||
            label.description.toLowerCase().includes('color'))
        )
        .slice(0, 3)
        .map(label => ({
          name: label.description,
          confidence: label.score
        }));

      const description = `This looks like a ${bestMatch.name.toLowerCase()}${
        scientificName && scientificName !== bestMatch.name ? `, also known as ${scientificName}` : ''
      }. I'm ${Math.round(bestMatch.confidence * 100)}% confident about this. ` +
        `The plant also shows features like ${relatedLabels.map(l => l.name.toLowerCase()).join(', ')}.`;

      return {
        name: bestMatch.name,
        scientificName,
        confidence: bestMatch.confidence,
        labels: relatedLabels,
        description,
        imageUri: processedImageUri
      };
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

      const newPlant = await addPlant({
        name: identificationResult.scientificName || identificationResult.name,
        nickname: identificationResult.name,
        image_url: identificationResult.imageUri,
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
    identifyPlant,
    saveIdentifiedPlant
  };
}
