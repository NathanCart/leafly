/* ------------------------------------------------------------------
   PlantDetail.tsx  –  full component (Duolingo-styled info pills)
   ------------------------------------------------------------------ */

import { useLocalSearchParams, useRouter } from 'expo-router';
import {
	ChevronDown,
	ChevronLeft,
	Droplet,
	Flower2,
	ImagePlus,
	Leaf,
	MapPin,
	Pencil,
	Ruler,
	Share2,
	Sun,
	Trash2,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Animated,
	FlatList,
	Image,
	Share,
	StatusBar,
	StyleSheet,
	TouchableOpacity,
	useColorScheme,
	useWindowDimensions,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { TaskCompletionModal } from '@/components/Care/TaskCompletionModal';
import { GalleryModal } from '@/components/PlantDetails/GalleryModal';
import { HealthHistorySection } from '@/components/PlantDetails/HealthHistorySection';
import { HeartButton } from '@/components/PlantDetails/HeartButton';
import { QuickActions } from '@/components/PlantDetails/QuickActions';
import { ScheduleModal, ScheduleSettings } from '@/components/PlantDetails/ScheduleModal';
import { Text } from '@/components/Text';
import { useAuth } from '@/contexts/AuthContext';
import { usePlants } from '@/contexts/DatabaseContext';
import { COLORS } from './constants/colors';
import { EditPlantStepperModal } from '@/components/PlantDetails/EditPlantModal';

/* -------------------------------------------------
 * Constants & helpers
 * -------------------------------------------------*/
const HEADER_HEIGHT = 300;
const MS_PER_DAY = 86_400_000;

const LIGHT_LABELS = { low: 'Low', medium: 'Medium', bright: 'Bright', full: 'Full Sun' } as const;
const SOIL_LABELS = {
	fast: 'Fast-draining',
	standard: 'Standard',
	moist: 'Moist-retentive',
} as const;
const PASTELS = ['#D9F8C4', '#C8F4FF', '#FFE4B8', '#EAD7FF']; // Duolingo-ish colours

type TaskType = 'Water' | 'Fertilize';
interface TaskEntry {
	id: string;
	type: TaskType;
	dueDate: Date;
	isOverdue: boolean;
	accent: string;
	amountMl?: number;
}

const getRelativeDate = (date: Date) => {
	const now = new Date();
	const diff = Math.ceil((date.getTime() - now.getTime()) / MS_PER_DAY);
	if (diff === 0) return 'Due today';
	if (diff === 1) return 'Due tomorrow';
	if (diff < 0) return `${Math.abs(diff)} days overdue`;
	return `Due in ${diff} days`;
};

const formatAgo = (d?: Date | string | null) => {
	if (!d) return '—';
	const date = typeof d === 'string' ? new Date(d) : d;
	const diff = Math.floor((Date.now() - date.getTime()) / MS_PER_DAY);
	if (diff === 0) return 'Today';
	if (diff === 1) return 'Yesterday';
	return `${diff} days ago`;
};

/* -------------------------------------------------
 * UI helpers
 * -------------------------------------------------*/
const Pill = ({
	index,
	icon,
	label,
}: {
	index: number;
	icon: React.ReactNode;
	label: string | number;
}) => {
	return (
		<View style={[styles.pill, { backgroundColor: COLORS.primary + '1A' }]}>
			<View style={styles.pillIcon}>{icon}</View>
			<Text numberOfLines={1} style={styles.pillText}>
				{label}
			</Text>
		</View>
	);
};

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
	const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

	return (
		<View style={styles.cardOuter}>
			{icon && <View style={styles.cardIcon}>{icon}</View>}
			<View style={styles.cardBody}>
				{title ? <Text style={styles.cardTitle}>{title}</Text> : null}
				<Text style={styles.cardText}>{displayed}</Text>
				{needsToggle && (
					<TouchableOpacity
						style={styles.expandBtn}
						onPress={() => {
							Animated.spring(anim, {
								toValue: expanded ? 0 : 1,
								useNativeDriver: true,
								tension: 40,
								friction: 7,
							}).start();
							setExpanded(!expanded);
						}}
					>
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
 * PlantDetail – main component
 * -------------------------------------------------*/
export default function PlantDetail() {
	const { id: plantId } = useLocalSearchParams<{ id: string }>();
	const { getPlantById, updatePlant, deletePlant, refreshPlants } = usePlants();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();
	const { session } = useAuth();
	const scheme = useColorScheme();
	const isDark = scheme === 'dark';

	const [plant, setPlant] = useState<any>(null);
	const [isFavorite, setIsFavorite] = useState(false);
	const [loading, setLoading] = useState(true);

	/* modal flags */
	const [showEditModal, setShowEditModal] = useState(false);
	const [showGalleryModal, setShowGalleryModal] = useState(false);
	const [showScheduleModal, setShowScheduleModal] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [selectedTask, setSelectedTask] = useState<TaskEntry | null>(null);

	/* parallax */
	const scrollY = useRef(new Animated.Value(0)).current;
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

	/* ---------- load plant ---------- */
	useEffect(() => {
		if (!plantId) return;
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

	/* ---------- tasks ---------- */
	const tasks: TaskEntry[] = useMemo(() => {
		if (!plant) return [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const out: TaskEntry[] = [];

		if (plant.watering_interval_days) {
			const last = plant.last_watered ? new Date(plant.last_watered) : null;
			const due = last
				? new Date(last.getTime() + plant.watering_interval_days * MS_PER_DAY)
				: today;
			out.push({
				id: `${plant.id}-water`,
				type: 'Water',
				amountMl: plant.watering_amount_ml,
				dueDate: due,
				isOverdue: due < today,
				accent: '#33A1FF',
			});
		}
		if (plant.fertilize_interval_days) {
			const last = plant.last_fertilized ? new Date(plant.last_fertilized) : null;
			const due = last
				? new Date(last.getTime() + plant.fertilize_interval_days * MS_PER_DAY)
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

	/* ---------- helpers ---------- */
	const handleShare = () => {
		if (!plant) return;
		Share.share({
			title: plant.name,
			message: `Check out my ${plant.name}!`,
			url: plant.image_url,
		});
	};

	const toggleFavorite = async () => {
		if (!plant) return;
		const updated = await updatePlant(plantId!, { is_favorite: !isFavorite });
		refreshPlants();
		setPlant(updated);
		setIsFavorite(updated.is_favorite);
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

	const handleSaveUpdates = async ({
		nickname,
		imageUri,
		light,
		potDiameter,
		soil,
		location,
		lastWatered,
	}: any) => {
		const payload: any = {
			nickname,
			image_url: imageUri ?? plant.image_url,
			light_amount: light,
			pot_diameter: potDiameter,
			soil_type: soil,
			location,
			last_watered: lastWatered?.toISOString?.() ?? plant.last_watered,
		};
		const updated = await updatePlant(plantId!, payload);
		refreshPlants();
		setPlant(updated);
		setIsFavorite(updated.is_favorite);
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

	const handleCompleteTask = async () => {
		if (!selectedTask) return;
		const field = selectedTask.type === 'Water' ? 'last_watered' : 'last_fertilized';
		const updated = await updatePlant(plantId!, { [field]: new Date().toISOString() });
		setPlant(updated);
		setSelectedTask(null);
	};

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

			{/* Parallax header */}
			<Animated.Image
				source={{ uri: plant.image_url }}
				style={[
					styles.headerImage,
					{ width: windowWidth, transform: [{ translateY }, { scale }] },
				]}
			/>

			{/* Top-left navigation */}
			<TouchableOpacity
				style={[styles.iconBtn, { left: 16, top: insets.top + 8 }]}
				onPress={() => router.back()}
			>
				<ChevronLeft color="#fff" size={24} />
			</TouchableOpacity>

			{/* Top-right favourite / share */}
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

			{/* Gallery shortcut */}
			<TouchableOpacity
				style={[styles.galleryBtn, { right: 16, top: insets.top + 60 }]}
				onPress={() => setShowGalleryModal(true)}
			>
				<ImagePlus color="#fff" size={16} />
				<Text style={styles.galleryText}>Gallery</Text>
			</TouchableOpacity>

			{/* Scrollable content */}
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

				{/* White content card */}
				<View style={styles.contentCard}>
					{/* Location badge */}
					<View style={styles.locationBadge}>
						<MapPin size={16} color={COLORS.primary} />
						<Text style={styles.locationText}>
							{plant.environment ?? plant.location ?? 'Indoor'} Plant
						</Text>
					</View>

					{/* Title row */}
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

					{/* ---------- DUOLINGO-STYLE PILL ROW ---------- */}
					<View style={styles.pillRow}>
						<Pill
							index={0}
							icon={<Sun size={14} color="#00000080" />}
							label={LIGHT_LABELS[plant.light_amount] ?? '—'}
						/>
						<Pill
							index={1}
							icon={<Ruler size={14} color="#00000080" />}
							label={`${plant.pot_diameter ?? '—'} in`}
						/>
						<Pill
							index={2}
							icon={<Flower2 size={14} color="#00000080" />}
							label={SOIL_LABELS[plant.soil_type] ?? 'Soil —'}
						/>
						<Pill
							index={3}
							icon={<Droplet size={14} color="#00000080" />}
							label={formatAgo(plant.last_watered)}
						/>
					</View>

					{/* Notes */}
					{plant.notes && (
						<Section title="Notes">
							<ExpandableCard title="" content={plant.notes} icon={null} />
						</Section>
					)}

					{/* Quick actions */}
					<QuickActions
						plantId={plantId}
						onPress={(type) => {
							if (type === 'Schedule') setShowScheduleModal(true);
							if (type === 'Camera') setShowGalleryModal(true);
						}}
					/>

					{/* Tasks */}
					<Section title={tasks.length ? 'Plant Care' : undefined}>
						{tasks.length === 0 ? (
							<EmptyTasks
								hasSchedule={Boolean(
									plant.watering_interval_days || plant.fertilize_interval_days
								)}
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
													{item.type}{' '}
													{!!item.amountMl && `(${item.amountMl}ml)`}
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

					{/* Health history */}
					<HealthHistorySection plantId={plantId} />

					{/* Care instructions */}
					<Section title="Care Instructions">
						<ExpandableCard
							title="Watering"
							content={
								plant.watering_details ??
								plant.raw?.details?.best_watering ??
								'No watering info'
							}
							icon={<Droplet fill="#33A1FF" size={32} color="#33A1FF" />}
						/>
						<ExpandableCard
							title="Light"
							content={
								plant.light_details ??
								plant.raw?.details?.best_light_condition ??
								'No light info'
							}
							icon={<Sun fill="#FFC43D" size={32} color="#FFC43D" />}
						/>
						<ExpandableCard
							title="Soil"
							content={
								plant.soil_details ??
								plant.raw?.details?.best_soil_type ??
								'No soil info'
							}
							icon={<Leaf fill="#4CAF50" size={32} color="#4CAF50" />}
						/>
					</Section>

					{/* Delete */}
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
			<EditPlantStepperModal
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

/* ---------- Section wrapper ---------- */
const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
	<View style={styles.section}>
		{title ? <Text style={[COLORS.titleMd, { marginBottom: 8 }]}>{title}</Text> : null}
		{children}
	</View>
);

/* -------------------------------------------------
 * Styles
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

	/* header */
	headerImage: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: HEADER_HEIGHT,
		resizeMode: 'cover',
	},

	/* top buttons */
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
	heartBtnTouchable: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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

	/* content card */
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

	/* title */
	title: { fontSize: 28, fontWeight: '700', color: COLORS.text.primary.light, marginBottom: 4 },
	subtitle: {
		fontSize: 16,
		fontStyle: 'italic',
		color: COLORS.text.secondary.light,
		marginBottom: 24,
	},

	editBtn: {
		padding: 10,
		backgroundColor: COLORS.primary,
		borderRadius: 20,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 3,
	},

	/* ---------- pills ---------- */
	pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
	pill: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 22,
		shadowColor: '#000',
		shadowOpacity: 0.06,
		shadowRadius: 4,
		elevation: 2,
		maxWidth: '48%',
	},
	pillIcon: {
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: '#ffffffb0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
	},
	pillText: { fontSize: 14, fontWeight: '700', color: '#222' },

	/* section */
	section: { marginBottom: 32 },

	/* expandable card */
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

	/* tasks */
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
	cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	cardPlant: { fontSize: 16, fontWeight: '600', color: '#111827' },
	cardType: { fontSize: 14, fontWeight: '500' },
	cardDate: { fontSize: 14, color: '#6B7280' },

	/* empty tasks */
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
