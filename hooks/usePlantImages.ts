import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

type PlantImage = Database['public']['Tables']['plant_images']['Row'];
type QueueOp =
	| { type: 'add'; data: Omit<PlantImage, 'id' | 'created_at'> }
	| { type: 'delete'; id: string };

// Storage keys
const CACHE_KEY = (plantId: string) => `plant_images_cache_${plantId}`;
const QUEUE_KEY = 'plant_images_queue';

// AsyncStorage-based cache and queue
async function getCachedImages(plantId: string): Promise<PlantImage[]> {
	try {
		const raw = await AsyncStorage.getItem(CACHE_KEY(plantId));
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

async function setCachedImages(plantId: string, images: PlantImage[]): Promise<void> {
	try {
		await AsyncStorage.setItem(CACHE_KEY(plantId), JSON.stringify(images));
	} catch {}
}

async function getQueue(): Promise<QueueOp[]> {
	try {
		const raw = await AsyncStorage.getItem(QUEUE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

async function setQueue(queue: QueueOp[]): Promise<void> {
	try {
		await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
	} catch {}
}

export function usePlantImages(plantId: string) {
	const { session } = useAuth();
	const [images, setImages] = useState<PlantImage[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [isOnline, setIsOnline] = useState<boolean>(true);

	// Track network status
	useEffect(() => {
		// initial fetch
		NetInfo.fetch().then((state) => setIsOnline(!!state.isConnected));
		const unsubscribe = NetInfo.addEventListener((state) => {
			setIsOnline(!!state.isConnected);
		});
		return () => unsubscribe();
	}, []);

	// Sync queued operations when back online
	useEffect(() => {
		if (isOnline && session?.user.id) {
			processQueue();
			loadImages();
		}
	}, [isOnline, session?.user.id, plantId]);

	const loadImages = useCallback(async () => {
		setLoading(true);
		try {
			let data: PlantImage[] = [];

			if (isOnline) {
				const { data: serverData, error: serverError } = await supabase
					.from('plant_images')
					.select('*')
					.eq('plant_id', plantId)
					.order('created_at', { ascending: false });
				if (serverError) throw serverError;
				data = serverData || [];
				await setCachedImages(plantId, data);
			} else {
				data = await getCachedImages(plantId);
			}

			setImages(data);
		} catch (e) {
			setError(e instanceof Error ? e : new Error('Failed to load plant images'));
		} finally {
			setLoading(false);
		}
	}, [isOnline, plantId]);

	const enqueueOp = useCallback(async (op: QueueOp) => {
		const queue = await getQueue();
		queue.push(op);
		await setQueue(queue);
	}, []);

	const processQueue = useCallback(async () => {
		const queue = await getQueue();
		if (!queue.length) return;

		const remaining: QueueOp[] = [];
		for (const op of queue) {
			try {
				if (op.type === 'add') {
					await supabase.from('plant_images').insert([op.data]);
				} else {
					await supabase.from('plant_images').delete().eq('id', op.id);
				}
			} catch {
				remaining.push(op);
			}
		}
		await setQueue(remaining);

		// Refresh cache after sync
		const { data } = await supabase
			.from('plant_images')
			.select('*')
			.eq('plant_id', plantId)
			.order('created_at', { ascending: false });
		if (data) {
			await setCachedImages(plantId, data);
			setImages(data);
		}
	}, [plantId]);

	const addImage = useCallback(
		async (imageUrl: string, notes?: string) => {
			const opData = {
				plant_id: plantId,
				image_url: imageUrl,
				user_id: session?.user.id!,
				notes: notes || null,
			};

			if (isOnline) {
				const { data, error } = await supabase
					.from('plant_images')
					.insert([opData])
					.select()
					.single();
				if (error) throw error;
				const updated = [data, ...images];
				await setCachedImages(plantId, updated);
				setImages(updated);
				return data;
			} else {
				await enqueueOp({ type: 'add', data: opData });
				const temp: PlantImage = {
					id: `temp-${Date.now()}`,
					created_at: new Date().toISOString(),
					...opData,
				};
				const updated = [temp, ...images];
				await setCachedImages(plantId, updated);
				setImages(updated);
				return temp;
			}
		},
		[isOnline, plantId, session?.user.id, images, enqueueOp]
	);

	const deleteImage = useCallback(
		async (imageId: string) => {
			if (isOnline) {
				const { error } = await supabase.from('plant_images').delete().eq('id', imageId);
				if (error) throw error;
				const updated = images.filter((img) => img.id !== imageId);
				await setCachedImages(plantId, updated);
				setImages(updated);
			} else {
				await enqueueOp({ type: 'delete', id: imageId });
				const updated = images.filter((img) => img.id !== imageId);
				await setCachedImages(plantId, updated);
				setImages(updated);
			}
		},
		[isOnline, images, plantId, enqueueOp]
	);

	// Initial load
	useEffect(() => {
		if (session?.user.id && plantId) {
			loadImages();
		} else {
			setLoading(false);
		}
	}, [session?.user.id, plantId, loadImages]);

	return {
		images,
		loading,
		error,
		addImage,
		deleteImage,
		refresh: loadImages,
		isOnline,
	};
}
