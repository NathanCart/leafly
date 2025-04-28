/* PlantDetail.tsx – full component */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
	ActivityIndicator,
	Alert,
	Animated,
	Share,
	StatusBar,
	StyleSheet,
	TouchableOpacity,
	useColorScheme,
	useWindowDimensions,
	View,
	FlatList,
	Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
	ChevronDown,
	ChevronLeft,
	Droplet,
	ImagePlus,
	Leaf,
	MapPin,
	Pencil,
	Share2,
	Sun,
	Trash2,
} from 'lucide-react-native';

import { Button } from '@/components/Button';
import { EditPlantModal } from '@/components/PlantDetails/EditPlantModal';
import { GalleryModal } from '@/components/PlantDetails/GalleryModal';
import { HealthHistorySection } from '@/components/PlantDetails/HealthHistorySection';
import { HeartButton } from '@/components/PlantDetails/HeartButton';
import { QuickActions } from '@/components/PlantDetails/QuickActions';
import { ScheduleModal, ScheduleSettings } from '@/components/PlantDetails/ScheduleModal';
import { TaskCompletionModal } from '@/components/Care/TaskCompletionModal';
import { Text } from '@/components/Text';
import { usePlants } from '@/contexts/DatabaseContext';
import { COLORS } from './constants/colors';
import { useAuth } from '@/contexts/AuthContext';

/* -------------------------------------------------
 * Constants & helper types
 * -------------------------------------------------*/
const HEADER_HEIGHT = 300;

type TaskType = 'Water' | 'Fertilize';
interface TaskEntry {
	id: string;
	type: TaskType;
	dueDate: Date;
	isOverdue: boolean;
	accent: string;
}

const getRelativeDate = (date: Date) => {
	const now = new Date();
	const diffDays = Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
	if (diffDays === 0) return 'Due today';
	if (diffDays === 1) return 'Due tomorrow';
	if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
	return `Due in ${diffDays} days`;
};

/* -------------------------------------------------
 * ExpandableCard – (unchanged from your code)
 * -------------------------------------------------*/
const ExpandableCard = ({
	title,
	content,
	icon,
}: {
	title: string;
	content: string;
	icon?: React.ReactNode;
}) => {
	const [expanded, setExpanded] = useState(false);
	const anim = useRef(new Animated.Value(0)).current;
	const needsToggle = content?.length > 64;
	const displayed = needsToggle && !expanded ? `${content.slice(0, 64)}…` : content;
	const rotate = anim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '180deg'],
	});

	const toggle = () => {
		Animated.spring(anim, {
			toValue: expanded ? 0 : 1,
			useNativeDriver: true,
			tension: 40,
			friction: 7,
		}).start();
		setExpanded(!expanded);
	};

	return (
		<View style={styles.cardOuter}>
			{icon && <View style={styles.cardIcon}>{icon}</View>}
			<View style={styles.cardBody}>
				{title ? <Text style={styles.cardTitle}>{title}</Text> : null}
				<Text style={styles.cardText}>{displayed}</Text>
				{needsToggle && (
					<TouchableOpacity style={styles.expandBtn} onPress={toggle}>
						<Text style={styles.expandLabel}>
							{expanded ? 'Show Less' : 'Read More'}
						</Text>
						<Animated.View style={{ transform: [{ rotate }] }}>
							<ChevronDown size={16} color={COLORS.primary} />
						</Animated.View>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
};

/* -------------------------------------------------
 * Empty-state view for Tasks section
 * -------------------------------------------------*/
/* ────────────────────────────────────────────────
 * 1.  Replace the old NoTasksToday with this
 * ────────────────────────────────────────────────*/
const EmptyTasks = ({ hasSchedule, onSetup }: { hasSchedule: boolean; onSetup: () => void }) => (
	<View style={styles.emptyState}>
		<Text style={styles.emptyTitle}>{hasSchedule ? 'No Tasks' : 'Care Not Set Up'}</Text>

		<Text style={styles.emptyText}>
			{hasSchedule
				? 'Nothing is due today. 🌿'
				: 'Create a watering or fertilizing schedule to start seeing tasks here.'}
		</Text>

		{!hasSchedule && (
			<Button variant="secondary" onPress={onSetup} style={{ marginTop: 16 }}>
				Set Up Care
			</Button>
		)}
	</View>
);

/* -------------------------------------------------
 * Main component
 * -------------------------------------------------*/
export default function PlantDetail() {
	const { id: plantId } = useLocalSearchParams<{ id: string }>();
	const { getPlantById, updatePlant, deletePlant, refreshPlants } = usePlants();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();
	const scheme = useColorScheme();
	const isDark = scheme === 'dark';
	const { session } = useAuth();
	const [plant, setPlant] = useState<any>(null);
	const [isFavorite, setIsFavorite] = useState(false);
	const [loading, setLoading] = useState(true);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showGalleryModal, setShowGalleryModal] = useState(false);
	const [showScheduleModal, setShowScheduleModal] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [selectedTask, setSelectedTask] = useState<TaskEntry | null>(null);
	const scrollY = useRef(new Animated.Value(0)).current;

	const hasSchedule =
		Boolean(plant?.watering_interval_days) || Boolean(plant?.fertilize_interval_days);

	/* ---------- load plant ---------- */
	useEffect(() => {
		(async () => {
			try {
				const data = await getPlantById(plantId!);
				setPlant(data);
				setIsFavorite(!!data?.is_favorite);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		})();
	}, [plantId]);

	/* ---------- build tasks ---------- */
	const tasks: TaskEntry[] = useMemo(() => {
		if (!plant) return [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const out: TaskEntry[] = [];

		// watering
		if (plant.watering_interval_days) {
			const last = plant.last_watered ? new Date(plant.last_watered) : null;
			const due = last
				? new Date(last.getTime() + plant.watering_interval_days * 86_400_000)
				: today;
			out.push({
				id: `${plant.id}-water`,
				type: 'Water',
				dueDate: due,
				isOverdue: due < today,
				accent: '#33A1FF',
			});
		}
		// fertilizing
		if (plant.fertilize_interval_days) {
			const last = plant.last_fertilized ? new Date(plant.last_fertilized) : null;
			const due = last
				? new Date(last.getTime() + plant.fertilize_interval_days * 86_400_000)
				: today;
			out.push({
				id: `${plant.id}-fertilize`,
				type: 'Fertilize',
				dueDate: due,
				isOverdue: due < today,
				accent: '#4CAF50',
			});
		}
		return out;
	}, [plant]);

	/* ---------- complete task (invoked from modal) ---------- */
	const handleCompleteTask = async () => {
		if (!selectedTask) return;
		const field = selectedTask.type === 'Water' ? 'last_watered' : 'last_fertilized';
		try {
			const updated = await updatePlant(plantId!, { [field]: new Date().toISOString() });
			setPlant(updated);
			setSelectedTask(null);
		} catch (err) {
			console.error(err);
		}
	};

	/* ---------- UI helper fns ---------- */
	const toggleFavorite = async () => {
		if (!plant) return;
		try {
			const updated = await updatePlant(plantId!, { is_favorite: !isFavorite });
			refreshPlants();
			setIsFavorite(updated.is_favorite);
			setPlant(updated);
		} catch (err) {
			console.error(err);
		}
	};

	const handleShare = async () => {
		if (!plant) return;
		try {
			await Share.share({
				title: plant.name,
				message: `Check out my ${plant.name}!`,
				url: plant.image_url,
			});
		} catch (err) {
			console.error(err);
		}
	};

	const confirmDelete = () => {
		Alert.alert('Delete Plant', 'This action cannot be undone.', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					try {
						setDeleting(true);
						await deletePlant(plantId!);
						router.back();
					} catch {
						Alert.alert('Error', 'Could not delete plant');
					} finally {
						setDeleting(false);
					}
				},
			},
		]);
	};

	const handleSaveUpdates = async ({ nickname, imageUri, location }: any) => {
		const payload: any = { nickname, location };
		if (imageUri) payload.image_url = imageUri;
		const updated = await updatePlant(plantId!, payload);
		refreshPlants();
		setPlant(updated);
		setIsFavorite(!!updated.is_favorite);
	};

	const handleSaveSchedule = async (schedule: ScheduleSettings) => {
		if (!plant) return;

		if (schedule?.fertilizing?.autoSchedule || schedule?.watering?.autoSchedule) {
			// Call the NEW multi-workout plan function endpoint

			const response = await fetch(
				'https://kvjaxrtgtjbqopegbshw.supabase.co/functions/v1/get-plant-schedule',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({
						...plant,
						watering_interval_days: null,
						fertilize_interval_days: null,
					}),
				}
			).then((res) => res.json());

			const updated = await updatePlant(plantId!, {
				watering_interval_days: schedule?.watering?.days ?? response?.waterFrequencyDays,
				fertilize_interval_days:
					schedule?.fertilizing?.days ?? response?.fertilizerFrequencyDays,
			});
			setPlant(updated);
		} else {
			try {
				const updated = await updatePlant(plantId!, {
					watering_interval_days: schedule.watering.days,
					fertilize_interval_days: schedule.fertilizing.days,
				});
				setPlant(updated);
			} catch (err) {
				console.error(err);
			}
		}
	};

	/* ---------- parallax values ---------- */
	const translateY = scrollY.interpolate({
		inputRange: [0, HEADER_HEIGHT],
		outputRange: [0, -HEADER_HEIGHT * 0.5],
		extrapolate: 'clamp',
	});
	const scale = scrollY.interpolate({
		inputRange: [-HEADER_HEIGHT, 0],
		outputRange: [2, 1],
		extrapolate: 'clamp',
	});

	/* ---------- loading / error states ---------- */
	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" color={COLORS.primary} />
			</View>
		);
	}
	if (!plant) {
		return (
			<View style={styles.center}>
				<Text style={{ color: COLORS.text.primary.light, marginBottom: 16 }}>
					Couldn't load plant.
				</Text>
				<Button variant="secondary" onPress={() => router.back()}>
					Go Back
				</Button>
			</View>
		);
	}

	/* ---------- render ---------- */
	return (
		<View style={styles.container}>
			<StatusBar translucent barStyle="light-content" />

			{/* Parallax header image */}
			<Animated.Image
				source={{ uri: plant.image_url }}
				style={[
					styles.headerImage,
					{ width: windowWidth, transform: [{ translateY }, { scale }] },
				]}
			/>

			{/* top buttons */}
			<TouchableOpacity
				style={[styles.iconBtn, { left: 16, top: insets.top + 8 }]}
				onPress={() => router.back()}
			>
				<ChevronLeft color="#fff" size={24} />
			</TouchableOpacity>
			<View style={[styles.iconBtn, { right: 16, top: insets.top + 8 }]}>
				<HeartButton
					isFavorite={isFavorite}
					onToggle={toggleFavorite}
					color={COLORS.error}
					style={styles.heartBtnTouchable}
				/>
			</View>
			<TouchableOpacity
				style={[styles.iconBtn, { right: 64, top: insets.top + 8 }]}
				onPress={handleShare}
			>
				<Share2 color="#fff" size={20} />
			</TouchableOpacity>
			<TouchableOpacity
				style={[styles.galleryBtn, { right: 16, top: insets.top + 60 }]}
				onPress={() => setShowGalleryModal(true)}
			>
				<ImagePlus color="#fff" size={16} />
				<Text style={styles.galleryText}>Gallery</Text>
			</TouchableOpacity>

			{/* Scroll content */}
			<Animated.ScrollView
				style={styles.scrollView}
				contentContainerStyle={{ paddingBottom: 80 }}
				showsVerticalScrollIndicator={false}
				scrollEventThrottle={16}
				onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
					useNativeDriver: true,
				})}
			>
				<View style={{ height: HEADER_HEIGHT }} />

				<View style={styles.contentCard}>
					{/* location badge */}
					<View style={styles.locationBadge}>
						<MapPin size={16} color={COLORS.primary} />
						<Text style={styles.locationText}>{plant.location || 'Indoor'} Plant</Text>
					</View>

					{/* title + edit */}
					<View style={{ flexDirection: 'row', gap: 8 }}>
						<View>
							<Text style={styles.title}>{plant.nickname || plant.name}</Text>
							<Text style={styles.subtitle}>{plant.name}</Text>
						</View>
						<TouchableOpacity
							style={styles.editBtn}
							onPress={() => setShowEditModal(true)}
						>
							<Pencil size={18} color="#fff" />
						</TouchableOpacity>
					</View>

					{/* notes */}
					{plant.notes && (
						<Section title="Notes">
							<ExpandableCard icon={<></>} title="" content={plant.notes} />
						</Section>
					)}

					{/* quick actions */}
					<QuickActions
						plantId={plantId}
						onPress={(type) => {
							if (type === 'Schedule') setShowScheduleModal(true);
							if (type === 'Camera') setShowGalleryModal(true);
						}}
					/>

					{/* ---------- TASKS ---------- */}
					<Section title={hasSchedule && !!tasks?.length ? 'Plant Care ' : ''}>
						{tasks.length === 0 ? (
							<EmptyTasks
								hasSchedule={hasSchedule}
								onSetup={() => setShowScheduleModal(true)}
							/>
						) : (
							<FlatList
								data={tasks}
								scrollEnabled={false}
								keyExtractor={(t) => t.id}
								ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
								renderItem={({ item }) => (
									<TouchableOpacity
										style={styles.taskCard}
										onPress={() => setSelectedTask(item)}
									>
										<Image
											source={{ uri: plant.image_url }}
											style={styles.plantImage}
										/>
										<View style={styles.cardContent}>
											<View style={styles.cardHeader}>
												<Text style={styles.cardPlant}>
													{plant.nickname || plant.name}
												</Text>
												<View
													style={[
														styles.cardIcon,
														{ backgroundColor: item.accent + '10' },
													]}
												>
													{item.type === 'Water' ? (
														<Droplet
															fill={item.accent}
															size={16}
															color={item.accent}
														/>
													) : (
														<Leaf
															fill={item.accent}
															size={16}
															color={item.accent}
														/>
													)}
												</View>
											</View>
											<View style={styles.cardRow}>
												<Text
													style={[
														styles.cardType,
														{ color: item.accent },
													]}
												>
													{item.type}
												</Text>
												<Text
													style={[
														styles.cardDate,
														item.isOverdue && { color: COLORS.error },
													]}
												>
													{getRelativeDate(item.dueDate)}
												</Text>
											</View>
										</View>
									</TouchableOpacity>
								)}
							/>
						)}
					</Section>

					{/* health history */}
					<HealthHistorySection plantId={plantId} />

					{/* care instructions */}
					<Section title="Care Instructions">
						<ExpandableCard
							title="Watering"
							content={plant.raw?.details?.best_watering || 'No watering info'}
							icon={<Droplet fill="#33A1FF" size={32} color="#33A1FF" />}
						/>
						<ExpandableCard
							title="Light"
							content={plant.raw?.details?.best_light_condition || 'No light info'}
							icon={<Sun fill="#FFC43D" size={32} color="#FFC43D" />}
						/>
						<ExpandableCard
							title="Soil"
							content={plant.raw?.details?.best_soil_type || 'No soil info'}
							icon={<Leaf fill="#4CAF50" size={32} color="#4CAF50" />}
						/>
					</Section>

					{/* delete */}
					<TouchableOpacity
						style={styles.deleteBtn}
						onPress={confirmDelete}
						disabled={deleting}
					>
						<Trash2 size={18} color={COLORS.error} />
						<Text style={[styles.deleteText, deleting && { opacity: 0.6 }]}>
							{deleting ? 'Deleting…' : 'Remove this Plant'}
						</Text>
					</TouchableOpacity>
				</View>
			</Animated.ScrollView>

			{/* ---------- MODALS ---------- */}
			<EditPlantModal
				visible={showEditModal}
				onClose={() => setShowEditModal(false)}
				onSave={handleSaveUpdates}
				plant={plant}
				isDark={isDark}
			/>
			<GalleryModal
				visible={showGalleryModal}
				onClose={() => setShowGalleryModal(false)}
				mainImage={plant.image_url}
				plantId={plantId!}
				isDark={isDark}
			/>
			<ScheduleModal
				plant={plant}
				visible={showScheduleModal}
				onClose={() => setShowScheduleModal(false)}
				onSave={handleSaveSchedule}
				initialSettings={plant.care_schedule}
				isDark={isDark}
			/>
			{selectedTask && (
				<TaskCompletionModal
					visible
					onClose={() => setSelectedTask(null)}
					onComplete={handleCompleteTask}
					plantName={plant.nickname || plant.name}
					taskType={selectedTask.type}
				/>
			)}
		</View>
	);
}

/* -------------------------------------------------
 * Section helper
 * -------------------------------------------------*/
const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
	<View style={styles.section}>
		{title ? <Text style={[COLORS.titleMd, { marginBottom: 8 }]}>{title}</Text> : null}
		{children}
	</View>
);

/* -------------------------------------------------
 * Styles – copied / consolidated from both screens
 * -------------------------------------------------*/
const styles = StyleSheet.create({
	/* layout */
	container: { flex: 1, backgroundColor: COLORS.surface.light },
	scrollView: { flex: 1 },

	/* loading / error */
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLORS.surface.light,
	},

	/* header image & top buttons */
	headerImage: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: HEADER_HEIGHT,
		resizeMode: 'cover',
	},
	setupBtn: {
		marginTop: 16,
		paddingVertical: 10,
		paddingHorizontal: 24,
		borderRadius: 12,
		backgroundColor: COLORS.primary,
	},
	setupText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	iconBtn: {
		position: 'absolute',
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	heartBtnTouchable: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	galleryBtn: {
		position: 'absolute',
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 16,
		backgroundColor: 'rgba(0,0,0,0.4)',
		zIndex: 10,
	},
	galleryText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 6 },

	/* white content card */
	contentCard: {
		backgroundColor: COLORS.surface.light,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		marginTop: -40,
		padding: 16,
	},

	/* location badge */
	locationBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		backgroundColor: COLORS.card.light,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		gap: 6,
		marginTop: -32,
		marginBottom: 16,
	},
	locationText: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary.light },

	/* titles */
	title: { fontSize: 28, fontWeight: '700', color: COLORS.text.primary.light, marginBottom: 4 },
	subtitle: {
		fontSize: 16,
		fontStyle: 'italic',
		color: COLORS.text.secondary.light,
		marginBottom: 24,
	},

	/* edit pencil */
	editBtn: {
		padding: 10,
		backgroundColor: COLORS.primary,
		borderRadius: 20,
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},

	/* generic section wrapper */
	section: { marginBottom: 32 },

	/* expandable cards (notes, care) */
	cardOuter: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 16,
		borderColor: COLORS.border,
		borderWidth: 2,
		marginBottom: 12,
	},
	cardIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: COLORS.surface.light,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	cardBody: { flex: 1 },
	cardTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
		color: COLORS.text.primary.light,
	},
	cardText: { fontSize: 14, lineHeight: 20, color: COLORS.text.secondary.light },
	expandBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingVertical: 4 },
	expandLabel: { fontSize: 14, fontWeight: '600', marginRight: 4, color: COLORS.primary },

	/* task cards (same look as CareSchedule) */
	taskCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF',
		padding: 12,
		borderBottomWidth: 2,
		borderColor: COLORS.border,
	},
	plantImage: { width: 56, height: 56, borderRadius: 14, marginRight: 12 },
	cardContent: { flex: 1 },
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},

	cardPlant: { fontSize: 16, fontWeight: '600', color: '#111827' },
	cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	cardType: { fontSize: 14, fontWeight: '500' },
	cardDate: { fontSize: 14, color: '#6B7280' },

	/* empty state (tasks) */
	emptyState: { alignItems: 'center', paddingVertical: 24 },
	emptyTitle: { fontSize: 24, fontWeight: '600', color: '#111827', marginBottom: 4 },
	emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center' },

	/* delete */
	deleteBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLORS.error + '1A',
		padding: 16,
		borderRadius: 12,
	},
	deleteText: { color: COLORS.error, fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
