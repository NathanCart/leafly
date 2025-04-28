import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
	View,
	TouchableOpacity,
	StyleSheet,
	Platform,
	StatusBar,
	Animated,
	PermissionsAndroid,
	FlatList,
	Image,
} from 'react-native';
import { HelpCircle, Leaf, X, Droplet } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Button } from '@/components/Button';
import { TaskCompletionModal } from '@/components/Care/TaskCompletionModal';
import { COLORS } from '../constants/colors';
import { usePlants } from '@/contexts/DatabaseContext';
import { PlantIllustration } from '@/components/PlantIllustation';
import { Text } from '@/components/Text';

// Entry interface
interface Entry {
	id: string;
	plantId: string;
	plantName: string;
	plantImage: string;
	type: 'Water' | 'Fertilize';
	dueDate: Date;
}

const getRelativeDate = (date: Date) => {
	const now = new Date();
	const diffTime = date.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return 'Due today';
	if (diffDays === 1) return 'Due tomorrow';
	if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
	return `Due in ${diffDays} days`;
};

const EmptyState = ({ message, scale }: { message: string; scale: Animated.Value }) => (
	<Animated.View style={[styles.emptyState, { transform: [{ scale }] }]}>
		<PlantIllustration size={200} color={COLORS.primary} />
		<Text style={styles.emptyTitle}>No Tasks</Text>
		<Text style={styles.emptyText}>{message}</Text>
	</Animated.View>
);

const CareSchedule = () => {
	const insets = useSafeAreaInsets();
	const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');
	const [permissionsGranted, setPermissionsGranted] = useState(false);
	const [promoClosed, setPromoClosed] = useState(false);
	const [selectedTask, setSelectedTask] = useState<Entry | null>(null);
	const { plants, updatePlant, refreshPlants } = usePlants();

	// Prepare dates
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Build schedule entries for watering & fertilizing
	const entries: Entry[] = [];
	plants.forEach((plant) => {
		if (plant.watering_interval_days) {
			let due: Date;
			if (plant.last_watered) {
				const last = new Date(plant.last_watered);
				due = new Date(last.getTime() + plant.watering_interval_days * 24 * 60 * 60 * 1000);
			} else {
				due = new Date(today);
			}
			entries.push({
				id: `${plant.id}-water`,
				plantId: plant.id,
				plantName: plant.nickname,
				plantImage: plant.image_url,
				type: 'Water',
				dueDate: due,
			});
		}
		if (plant.fertilize_interval_days) {
			let due: Date;
			if (plant.last_fertilized) {
				const last = new Date(plant.last_fertilized);
				due = new Date(
					last.getTime() + plant.fertilize_interval_days * 24 * 60 * 60 * 1000
				);
			} else {
				due = new Date(today);
			}
			entries.push({
				id: `${plant.id}-fertilize`,
				plantId: plant.id,
				plantName: plant.name,
				plantImage: plant.image_url,
				type: 'Fertilize',
				dueDate: due,
			});
		}
	});

	// Filter for today vs upcoming
	const scheduleToday = entries.filter((e) => {
		const d = new Date(e.dueDate);
		d.setHours(0, 0, 0, 0);
		return d.getTime() === today.getTime();
	});
	const scheduleUpcoming = entries
		.filter((e) => {
			const d = new Date(e.dueDate);
			d.setHours(0, 0, 0, 0);
			return d.getTime() > today.getTime();
		})
		?.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

	// Animation for empty / promo
	const scaleAnim = useRef(new Animated.Value(0)).current;
	useFocusEffect(
		useCallback(() => {
			scaleAnim.setValue(0);
			Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
		}, [])
	);

	// Check notification permissions
	useEffect(() => {
		(async () => {
			const { status } = await Notifications.getPermissionsAsync();
			setPermissionsGranted(status === 'granted');
		})();
	}, []);

	const requestPermissions = async () => {
		let granted = false;
		if (Device.isDevice) {
			const { status } = await Notifications.requestPermissionsAsync();
			granted = status === 'granted';
		} else if (Platform.OS === 'android') {
			const result = await PermissionsAndroid.request(
				PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
			);
			granted = result === PermissionsAndroid.RESULTS.GRANTED;
		}
		setPermissionsGranted(granted);
	};

	const handleCompleteTask = async () => {
		if (!selectedTask) return;

		try {
			const updateField = selectedTask.type === 'Water' ? 'last_watered' : 'last_fertilized';
			await updatePlant(selectedTask.plantId, {
				[updateField]: new Date().toISOString(),
			});
			setSelectedTask(null);
		} catch (error) {
			console.error('Failed to complete task:', error);
		}
	};

	// Entry renderer
	const renderEntry = ({ item }: { item: Entry }) => {
		const isWatering = item.type === 'Water';
		const accentColor = isWatering ? '#33A1FF' : '#4CAF50';
		const relativeDate = getRelativeDate(item.dueDate);
		const isOverdue = item.dueDate.getTime() < today.getTime();

		return (
			<TouchableOpacity style={styles.card} onPress={() => setSelectedTask(item)}>
				<View style={COLORS.shadowLg}>
					<Image source={{ uri: item.plantImage }} style={styles.plantImage} />
				</View>
				<View style={styles.cardContent}>
					<View style={styles.cardHeader}>
						<Text style={styles.cardPlant}>{item.plantName}</Text>
						<View style={[styles.cardIcon, { backgroundColor: accentColor + '10' }]}>
							{isWatering ? (
								<Droplet fill={accentColor} size={16} color={accentColor} />
							) : (
								<Leaf fill={accentColor} size={16} color={accentColor} />
							)}
						</View>
					</View>
					<View style={styles.cardRow}>
						<Text style={[styles.cardType, { color: accentColor }]}>{item.type}</Text>
						<Text style={[styles.cardDate, isOverdue && { color: COLORS.error }]}>
							{relativeDate}
						</Text>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<View style={[styles.container, { paddingTop: insets.top + 8, backgroundColor: '#fff' }]}>
			<StatusBar barStyle="dark-content" />

			{/* Info Modal */}
			{/* {showInfo && (
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<TouchableOpacity
							onPress={() => setShowInfo(false)}
							style={styles.modalCloseButton}
						>
							<X size={20} color="#000" />
						</TouchableOpacity>
						<Text style={styles.modalTitle}>About Care Schedule</Text>
						<Text style={styles.modalText}>
							The "Today" tab lists tasks due today, while "Upcoming" shows future
							tasks.
						</Text>
						<Button onPress={() => setShowInfo(false)} style={{ marginTop: 16 }}>
							Got it
						</Button>
					</View>
				</View>
			)} */}

			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Leaf color={COLORS.tabBar.active} size={24} />
					<Text style={styles.headerTitle}>Care Schedule</Text>
				</View>
				{/* <TouchableOpacity onPress={() => setShowInfo(true)}>
					<HelpCircle color="#000" size={24} />
				</TouchableOpacity> */}
			</View>

			{/* Tabs */}
			<View style={styles.tabContainer}>
				<View style={styles.tabsWrapper}>
					{(['today', 'upcoming'] as const).map((tabKey) => (
						<TouchableOpacity
							key={tabKey}
							onPress={() => setActiveTab(tabKey)}
							style={styles.tab}
						>
							<Text
								style={[
									styles.tabText,
									activeTab === tabKey && styles.activeTabText,
								]}
							>
								{tabKey === 'today' ? 'Today' : 'Upcoming'}
							</Text>
							{activeTab === tabKey && <View style={styles.activeTabIndicator} />}
						</TouchableOpacity>
					))}
				</View>
			</View>

			{/* List */}
			<View style={styles.listContainer}>
				<FlatList
					data={activeTab === 'today' ? scheduleToday : scheduleUpcoming}
					keyExtractor={(item) => item.id}
					renderItem={renderEntry}
					contentContainerStyle={styles.listContent}
					ListEmptyComponent={() => (
						<EmptyState
							message={
								activeTab === 'today'
									? 'No tasks due today. Time to relax!'
									: 'No upcoming tasks scheduled'
							}
							scale={scaleAnim}
						/>
					)}
				/>
			</View>

			{/* Promo */}
			{!permissionsGranted && !promoClosed && (
				<Animated.View
					style={[styles.inlinePromoCard, { transform: [{ scale: scaleAnim }] }]}
				>
					<TouchableOpacity
						onPress={() => setPromoClosed(true)}
						style={styles.promoCloseButton}
					>
						<X size={20} color="#000" />
					</TouchableOpacity>
					<Text style={styles.promoTitle}>Smart Reminders</Text>
					<Text style={styles.promoDescription}>
						Enable notifications for watering and fertilizing reminders.
					</Text>
					<Button variant="secondary" onPress={requestPermissions}>
						Enable Notifications
					</Button>
				</Animated.View>
			)}

			{/* Task Completion Modal */}
			{selectedTask && (
				<TaskCompletionModal
					visible={true}
					onClose={() => setSelectedTask(null)}
					onComplete={handleCompleteTask}
					plantName={selectedTask.plantName}
					taskType={selectedTask.type}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		marginBottom: 8,
	},
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#111827',
	},

	tabContainer: {
		paddingTop: 8,
		borderBottomWidth: 2,
		borderBottomColor: '#E5E7EB',
	},
	tabsWrapper: {
		flexDirection: 'row',
		paddingHorizontal: 16,
	},
	tab: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 12,
	},
	tabText: {
		color: '#6B7280',
		fontSize: 16,
		fontWeight: '700',
	},
	activeTabText: {
		color: COLORS.primary,
		fontWeight: '700',
	},
	activeTabIndicator: {
		position: 'absolute',
		bottom: -1,
		left: 0,
		right: 0,
		height: 2,
		backgroundColor: COLORS.primary,
	},

	listContainer: {
		flex: 1,
	},
	listContent: {
		padding: 16,
		flexGrow: 1,
	},
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF',
		padding: 12,
		marginBottom: 12,
		borderBottomWidth: 2,
		borderColor: COLORS.border,
	},
	plantImage: {
		width: 56,
		height: 56,
		borderRadius: 14,

		marginRight: 12,
	},
	cardContent: {
		flex: 1,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	cardIcon: {
		width: 28,
		height: 28,
		borderRadius: 14,
		justifyContent: 'center',
		alignItems: 'center',
	},
	cardPlant: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111827',
	},
	cardRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	cardType: {
		fontSize: 14,
		fontWeight: '500',
	},
	cardDate: {
		fontSize: 14,
		color: '#6B7280',
	},

	emptyState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 400,
	},
	emptyStateImage: {
		width: 200,
		height: 200,
		borderRadius: 100,
		marginBottom: 24,
	},
	emptyTitle: {
		fontSize: 24,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 8,
	},
	emptyText: {
		fontSize: 16,
		color: '#6B7280',
		textAlign: 'center',
	},

	inlinePromoCard: {
		margin: 16,
		padding: 16,
		borderWidth: 2,
		borderRadius: 16,

		borderColor: COLORS.border,
		alignItems: 'center',
	},
	promoCloseButton: {
		position: 'absolute',
		top: 8,
		right: 8,
		padding: 4,
	},
	promoTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 4,
	},
	promoDescription: {
		fontSize: 14,
		color: '#4B5563',
		textAlign: 'center',
		marginBottom: 12,
	},

	modalOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	modalContent: {
		width: '100%',
		maxWidth: 400,
		backgroundColor: '#FFF',
		borderRadius: 16,
		padding: 24,
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.25,
				shadowRadius: 4,
			},
			android: {
				elevation: 5,
			},
		}),
	},
	modalCloseButton: {
		position: 'absolute',
		top: 16,
		right: 16,
		padding: 4,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 8,
	},
	modalText: {
		fontSize: 16,
		color: '#4B5563',
		lineHeight: 24,
	},
});

export default CareSchedule;
