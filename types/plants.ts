/**
 * Refined typings for a single suggestion item returned by Plant.ID,
 * based on the sample payload you provided.
 *
 * – All machine IDs are kept as plain strings, but you can mark them `never`
 *   or omit them entirely if you truly never want to expose them in code.
 * – Optional (`?`) flags are added where the sample showed `null` or a
 *   property that may be missing.
 * – Catch‑all index signatures (`[key: string]: any`) are added sparingly,
 *   only where the API can return unpredictable extra fields.
 */

export interface PlantSuggestion {
	/** Per‑plant metadata & knowledge‑base info */
	details: PlantDetails;

	/** Internal identifier for this suggestion result (hash, UUID, …) */
	id: string;

	/** Display name (usually the best match common or scientific name) */
	name: string;

	/** Model confidence (0 – 1) */
	probability: number;

	/** Set of visually similar reference images */
	similar_images: PlantSimilarImage[];
}

/* ────────────────────────────────────────────────────────── */

export interface PlantDetails {
	/* — “Best practise” text blocks — */
	best_light_condition: string;
	best_soil_type: string;
	best_watering: string;

	/* — Human‑friendly info — */
	common_names: string[];
	common_uses: string;
	cultural_significance: string;
	description: RichTextBlock;

	/* — Safety / edibility — */
	edible_parts?: string[] | null;
	toxicity?: string;

	/* — IDs / external references — */
	entity_id: string;
	gbif_id?: number;
	inaturalist_id?: number;

	/* — Media — */
	image?: LicensedImage;
	images?: Record<string, unknown>[]; // generic, unknown structure

	/* — Language & taxonomy — */
	language: string;
	rank: string;
	taxonomy: PlantTaxonomy;

	/* — Propagation & care — */
	propagation_methods?: string[] | null;
	watering?: {
		min?: number;
		max?: number;
		[key: string]: any;
	} | null;

	/* — Links — */
	url?: string;

	/** Any extra fields the API may introduce that we haven’t covered yet */
	[key: string]: unknown;
}

/* ────────────────────────────────────────────────────────── */

export interface RichTextBlock {
	value: string;
	citation?: string;
	license_name?: string;
	license_url?: string;
	[key: string]: unknown;
}

export interface LicensedImage {
	value: string; // image URL
	citation?: string;
	license_name?: string;
	license_url?: string;
	[key: string]: unknown;
}

export interface PlantSimilarImage {
	id: string;
	url: string;
	url_small?: string;
	similarity: number;
	citation?: string;
	license_name?: string;
	license_url?: string;
	[key: string]: unknown;
}

export interface PlantTaxonomy {
	kingdom?: string;
	phylum?: string;
	class?: string;
	order?: string;
	family?: string;
	genus?: string;
	[key: string]: unknown;
}

/**
 * Represents the raw detail object returned by the Plant.ID v3 API
 */
/**
 * Represents each suggestion item in the Plant.ID v3 classification response
 */
export interface PlantIdSuggestionRaw {
	capturedImageUri: string;
	location?: string;
	details: PlantDetails;
	id: string;
	name: string;
	probability: number;
	similar_images: Array<{
		/** URL for a similar image */
		url: string;
		[key: string]: any;
	}>;
}

export type PlantHealthReport = {
	access_token: string;
	model_version: string;
	custom_id: string | null;
	input: {
		latitude: number;
		longitude: number;
		similar_images: boolean;
		health: string;
		images: string[];
		datetime: string;
	};
	result: {
		is_plant: {
			probability: number;
			threshold: number;
			binary: boolean;
		};
		is_healthy: {
			binary: boolean;
			threshold: number;
			probability: number;
		};
		disease: {
			suggestions: {
				id: string;
				name: string;
				probability: number;
				similar_images: {
					id: string;
					url: string;
					license_name: string;
					license_url: string;
					citation: string;
					similarity: number;
					url_small: string;
				}[];
				details: {
					language: string;
					entity_id: string;
				};
			}[];
			question: {
				text: string;
				translation: string;
				options: {
					yes: {
						suggestion_index: number;
						entity_id: string;
						name: string;
						translation: string;
					};
					no: {
						suggestion_index: number;
						entity_id: string;
						name: string;
						translation: string;
					};
				};
			};
		};
	};
	status: string;
	sla_compliant_client: boolean;
	sla_compliant_system: boolean;
	created: number;
	completed: number;
};

/**
 * Full API response for classification suggestions
 */
export type PlantIdClassificationResponse = PlantIdSuggestionRaw[];
