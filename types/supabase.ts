import { PlantIdSuggestionRaw } from './plants';

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
				};
				Insert: {
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
				};
				Update: {
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
