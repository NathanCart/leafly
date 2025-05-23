import { PlantHealthReport, PlantIdSuggestionRaw } from './plants';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					username: string | null;
					avatar_url: string | null;
					created_at: string;
					email: string | null;

					updated_at: string;
				};
				Insert: {
					id: string;
					username?: string | null;
					avatar_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					username?: string | null;
					avatar_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			plants: {
				Row: {
					is_toxic_to_animals: boolean;
					toxicity_description: string | null;
					watering_details: string;
					soil_details: string;
					light_details: string;
					watering_amount_ml: number;

					id: string;
					user_id: string;
					name: string;
					nickname: string | null;
					image_url: string | null;
					location: string | null;
					health_status: string | null;
					acquisition_date: string | null;
					notes: string | null;
					is_favorite: boolean;
					created_at: string;
					updated_at: string;
					raw: PlantIdSuggestionRaw;
					last_watered?: string | null;
					last_fertilized?: string | null;
					watering_interval_days?: number | null;
					fertilize_interval_days?: number | null;
					soil_type: string;
					pot_diameter: string;
					light_amount: string;
				};
				Insert: {
					is_toxic_to_animals: boolean;
					toxicity_description: string | null;
					id?: string;
					user_id: string;
					name: string;
					nickname?: string | null;
					image_url?: string | null;
					location?: string | null;
					health_status?: string | null;
					acquisition_date?: string | null;
					notes?: string | null;
					is_favorite?: boolean;
					created_at?: string;
					updated_at?: string;
					raw: PlantIdSuggestionRaw;
					last_watered?: string | null;
					last_fertilized?: string | null;
					watering_interval_days?: number | null;
					fertilize_interval_days?: number | null;
					watering_details: string;
					soil_details: string;
					light_details: string;
					watering_amount_ml: number;
					soil_type: string;
					pot_diameter: string;
					light_amount: string;
				};
				Update: {
					is_toxic_to_animals: boolean;
					toxicity_description: string | null;
					id?: string;
					user_id?: string;
					name?: string;
					nickname?: string | null;
					image_url?: string | null;
					location?: string | null;
					health_status?: string | null;
					acquisition_date?: string | null;
					notes?: string | null;
					is_favorite?: boolean;
					created_at?: string;
					updated_at?: string;
					raw: PlantIdSuggestionRaw;
					last_watered?: string | null;
					last_fertilized?: string | null;
					watering_interval_days?: number | null;
					fertilize_interval_days?: number | null;
					watering_details: string;
					soil_details: string;
					light_details: string;
					watering_amount_ml: number;
					soil_type: string;
					pot_diameter: string;
					light_amount: string;
				};
			};
			plant_images: {
				Row: {
					id: string;
					plant_id: string;
					image_url: string;
					notes: string | null;
					created_at: string;
				};
				Insert: {
					id: string;
					plant_id: string;
					user_id: string;
					created_at: string;
					image_url: string;
					raw: PlantHealthReport;
				};
				Update: {
					id: string;
					plant_id: string;
					user_id: string;
					created_at: string;
					image_url: string;
					raw: PlantHealthReport;
				};
			};
			plant_health_reports: {
				Row: {
					id: string;
					plant_id: string;
					user_id: string;
					created_at: string;
					image_url: string;
					raw: PlantHealthReport;
				};
				Insert: {
					id?: string;
					plant_id: string;
					image_url: string;
					notes?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					plant_id?: string;
					image_url?: string;
					notes?: string | null;
					created_at?: string;
				};
			};
			care_schedule: {
				Row: {
					id: string;
					plant_id: string;
					action: string;
					scheduled_date: string;
					scheduled_time: string | null;
					completed: boolean;
					notes: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					plant_id: string;

					action: string;
					scheduled_date: string;
					scheduled_time?: string | null;
					completed?: boolean;
					notes?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					plant_id?: string;
					action?: string;
					scheduled_date?: string;
					scheduled_time?: string | null;
					completed?: boolean;
					notes?: string | null;
					created_at?: string;
				};
			};
		};
	};
}
