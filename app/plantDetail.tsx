import React, { useEffect, useRef, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Animated,
	useWindowDimensions,
	StatusBar,
	Share,
	Alert,
	ActivityIndicator,
	useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
	ChevronLeft,
	MapPin,
	Pen,
	ImagePlus,
	Share2,
	Trash2,
	Droplet,
	Sun,
	Leaf,
	ChevronDown,
	Pencil,
} from 'lucide-react-native';
import { usePlants } from '@/hooks/usePlants';
import { Button } from '@/components/Button';
import { EditPlantModal } from '@/components/PlantDetails/EditPlantModal';
import { GalleryModal } from '@/components/PlantDetails/GalleryModal';
import { ScheduleModal, ScheduleSettings } from '@/components/PlantDetails/ScheduleModal';
import { COLORS } from './constants/colors';
import { HeartButton } from '@/components/PlantDetails/HeartButton';
import { ScheduleDisplay } from '@/components/PlantDetails/ScheduleDisplay';

const HEADER_HEIGHT = 300;

// Expandable Card
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

export default function PlantDetail() {
	const { getPlantById, updatePlant, deletePlant } = usePlants();
	const { id: plantId } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();
	const scheme = useColorScheme();
	const isDark = scheme === 'dark';

	const [plant, setPlant] = useState<any>(null);
	const [isFavorite, setIsFavorite] = useState(false);
	const [loading, setLoading] = useState(true);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showGalleryModal, setShowGalleryModal] = useState(false);
	const [showScheduleModal, setShowScheduleModal] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const scrollY = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		(async () => {
			try {
				const data = await getPlantById(plantId!);
				setPlant(data);
				setIsFavorite(!!data?.is_favorite);
			} catch (e) {
				console.error(e);
			}
			setLoading(false);
		})();
	}, [plantId]);

	const toggleFavorite = async () => {
		if (!plant) return;
		try {
			const updated = await updatePlant(plantId!, { is_favorite: !isFavorite });
			setIsFavorite(updated.is_favorite);
			setPlant(updated);
		} catch (e) {
			console.error(e);
		}
	};

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

	const handleShare = async () => {
		if (!plant) return;
		try {
			await Share.share({
				title: plant.name,
				message: `Check out my ${plant.name}!`,
				url: plant.image_url,
			});
		} catch (e) {
			console.error(e);
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
		setPlant(updated);
		setIsFavorite(!!updated.is_favorite);
	};

	const handleSaveSchedule = async (scheduleSettings: ScheduleSettings) => {
		console.log(scheduleSettings, 'scheduleSettings');
		if (!plant) return;
		try {
			const updated = await updatePlant(plantId!, {
				watering_interval_days: scheduleSettings.watering.days,
				fertilize_interval_days: scheduleSettings.fertilizing.days,
			});
			setPlant(updated);
		} catch (e) {
			console.error(e);
		}
	};

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

	return (
		<View style={styles.container}>
			<StatusBar translucent barStyle="light-content" />

			{/* Parallax Header Image */}
			<Animated.Image
				source={{ uri: plant.image_url }}
				style={[
					styles.headerImage,
					{ width: windowWidth, transform: [{ translateY }, { scale }] },
				]}
			/>

			{/* Back */}
			<TouchableOpacity
				style={[styles.iconBtn, { left: 16, top: insets.top + 8 }]}
				onPress={() => router.back()}
			>
				<ChevronLeft color="#fff" size={24} />
			</TouchableOpacity>

			{/* Favorite */}
			<View style={[styles.iconBtn, { right: 16, top: insets.top + 8 }]}>
				<HeartButton
					isFavorite={isFavorite}
					onToggle={toggleFavorite}
					color={COLORS.error}
					style={styles.heartBtnTouchable}
				/>
			</View>

			{/* Share */}
			<TouchableOpacity
				style={[styles.iconBtn, { right: 64, top: insets.top + 8 }]}
				onPress={handleShare}
			>
				<Share2 color="#fff" size={20} />
			</TouchableOpacity>

			{/* Gallery Pill (inside header) */}
			<TouchableOpacity
				style={[styles.galleryBtn, { right: 16, top: insets.top + 60 }]}
				onPress={() => setShowGalleryModal(true)}
			>
				<ImagePlus color="#fff" size={16} />
				<Text style={styles.galleryText}>Gallery</Text>
			</TouchableOpacity>

			{/* Main content */}
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
					<View style={styles.locationBadge}>
						<MapPin size={16} color={COLORS.primary} />
						<Text style={styles.locationText}>{plant.location || 'Indoor'} Plant</Text>
					</View>

					<View
						style={{
							display: 'flex',
							flexDirection: 'row',
							gap: 8,
						}}
					>
						<View>
							<Text style={styles.title}>{plant.nickname || plant.name}</Text>
							<Text style={styles.subtitle}>{plant.name}</Text>
						</View>

						<View>
							<TouchableOpacity
								style={{
									padding: 8,
									backgroundColor: 'rgba(0,0,0,0.05)',
									borderRadius: 20,
								}}
								onPress={() => setShowEditModal(true)}
							>
								<Pencil size={20} color={COLORS.primary} />
							</TouchableOpacity>
						</View>
					</View>

					{plant.notes && (
						<Section title="Notes">
							<ExpandableCard icon={<></>} title="" content={plant.notes} />
						</Section>
					)}

					<Section title="Schedule">
						<ScheduleDisplay
							scheduleSettings={plant.care_schedule}
							onPress={() => setShowScheduleModal(true)}
						/>
					</Section>

					<Section title="Care Instructions">
						<ExpandableCard
							title="Watering"
							content={plant.raw?.details?.best_watering || 'No watering info'}
							icon={<Droplet size={24} color="#33A1FF" />}
						/>
						<ExpandableCard
							title="Light"
							content={plant.raw?.details?.best_light_condition || 'No light info'}
							icon={<Sun size={24} color="#FFC43D" />}
						/>
						<ExpandableCard
							title="Soil"
							content={plant.raw?.details?.best_soil_type || 'No soil info'}
							icon={<Leaf size={24} color="#4CAF50" />}
						/>
					</Section>

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
		</View>
	);
}

const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
	<View style={styles.section}>
		{title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
		{children}
	</View>
);

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.surface.light },
	scrollView: { flex: 1 },

	headerImage: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: HEADER_HEIGHT,
		resizeMode: 'cover',
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
	galleryText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '600',
		marginLeft: 6,
	},

	contentCard: {
		backgroundColor: COLORS.surface.light,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		marginTop: -40,
		padding: 16,
	},

	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLORS.surface.light,
	},

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
	locationText: {
		fontSize: 14,
		fontWeight: '600',
		color: COLORS.text.primary.light,
	},

	title: {
		fontSize: 28,
		fontWeight: '700',
		color: COLORS.text.primary.light,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 16,
		fontStyle: 'italic',
		color: COLORS.text.secondary.light,
		marginBottom: 24,
	},

	actionsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 32,
	},
	quickAction: {
		alignItems: 'center',
		width: '30%',
		backgroundColor: COLORS.card.light,
		padding: 16,
		borderRadius: 12,
	},
	quickLabel: {
		marginTop: 6,
		fontSize: 14,
		fontWeight: '500',
		color: COLORS.text.primary.light,
	},

	section: { marginBottom: 32 },
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: COLORS.text.primary.light,
		marginBottom: 12,
	},

	cardOuter: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		padding: 16,
		borderRadius: 16,
		backgroundColor: COLORS.card.light,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
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
	cardText: {
		fontSize: 14,
		lineHeight: 20,
		color: COLORS.text.secondary.light,
	},
	expandBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
		paddingVertical: 4,
	},
	expandLabel: {
		fontSize: 14,
		fontWeight: '600',
		marginRight: 4,
		color: COLORS.primary,
	},

	deleteBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLORS.error + '1A',
		padding: 16,
		borderRadius: 12,
	},
	deleteText: {
		color: COLORS.error,
		fontSize: 16,
		fontWeight: '600',
		marginLeft: 8,
	},
});
