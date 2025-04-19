export interface PlantIdentificationResult {
  name: string;
  scientificName: string;
  confidence: number;
  description: string;
  imageUri: string;
  capturedImageUri?: string; // Original captured image
  similarImages: string[];
  family: string;
  commonNames: string[];
  careInstructions?: {
    light?: string;
    water?: string;
    soil?: string;
    temperature?: string;
    humidity?: string;
  };
}