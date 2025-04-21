import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Platform,
	StatusBar,
	Animated,
	PermissionsAndroid,
} from 'react-native';
import { HelpCircle, Leaf, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Button } from '@/components/Button';
import { COLORS } from '../constants/colors';

const CareSchedule = () => {
	const insets = useSafeAreaInsets();
	const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');
	const [showInfo, setShowInfo] = useState(false);
	const [permissionsGranted, setPermissionsGranted] = useState(false);
	const [promoClosed, setPromoClosed] = useState(false);

	// If you have schedule items, skip the promo
	const scheduleItems: any[] = [];

	const scaleAnim = useRef(new Animated.Value(0)).current;
	useFocusEffect(
		useCallback(() => {
			scaleAnim.setValue(0);
			Animated.spring(scaleAnim, {
				toValue: 1,
				friction: 5,
				useNativeDriver: true,
			}).start();
		}, [])
	);

	// Check current permission status
	useEffect(() => {
		(async () => {
			const { status } = await Notifications.getPermissionsAsync();
			setPermissionsGranted(status === 'granted');
		})();
	}, []);

	// Fire native prompt
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

	return (
		<View style={[styles.container, { paddingTop: insets.top + 8 }]}>
			<StatusBar barStyle="dark-content" />

			{/* Info Modal */}
			{showInfo && (
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<TouchableOpacity
							style={styles.modalCloseButton}
							onPress={() => setShowInfo(false)}
						>
							<X size={20} color="#000" />
						</TouchableOpacity>
						<Text style={styles.modalTitle}>About Care Schedule</Text>
						<Text style={styles.modalText}>
							This page helps you stay on top of your plant care tasks. The “Today”
							tab shows what needs doing right now, while “Upcoming” lists tasks
							planned for future dates.
						</Text>
						<Button onPress={() => setShowInfo(false)} style={{ marginTop: 16 }}>
							Got it
						</Button>
					</View>
				</View>
			)}

			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Leaf color={COLORS.tabBar.active} size={24} />
					<Text style={styles.headerTitle}>Care Schedule</Text>
				</View>
				<TouchableOpacity style={styles.headerButton} onPress={() => setShowInfo(true)}>
					<HelpCircle color="#000" size={24} />
				</TouchableOpacity>
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

			{/* Empty State & Plant Illustration */}
			<View style={styles.emptyState}>
				<Animated.View
					style={[styles.plantIllustration, { transform: [{ scale: scaleAnim }] }]}
				>
					<View style={styles.plantPot} />
					<View style={styles.plantLeaves}>
						<View style={[styles.leaf, styles.leafLeft]} />
						<View style={[styles.leaf, styles.leafMiddle]} />
						<View style={[styles.leaf, styles.leafRight]} />
					</View>
					<Text style={[styles.sparkle, styles.sparkleTopLeft]}>★</Text>
					<Text style={[styles.sparkle, styles.sparkleTopRight]}>★</Text>
					<Text style={[styles.sparkle, styles.sparkleBottom]}>★</Text>
				</Animated.View>
			</View>

			{/* Inline Promo Card with Close Button */}
			{scheduleItems.length === 0 && !permissionsGranted && !promoClosed && (
				<View style={styles.inlinePromoContainer}>
					<Animated.View
						style={[styles.inlinePromoCard, { transform: [{ scale: scaleAnim }] }]}
					>
						<TouchableOpacity
							style={styles.promoCloseButton}
							onPress={() => setPromoClosed(true)}
						>
							<X size={20} color="#000" />
						</TouchableOpacity>
						<Text style={styles.promoTitle}>Smart Reminders</Text>
						<Text style={styles.promoDescription}>
							Get notified when your plants are ready for a nutrient boost!
						</Text>
						<Button variant="secondary" onPress={requestPermissions}>
							Set up
						</Button>
					</Animated.View>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#FFF' },

	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
	},
	headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	headerTitle: { fontSize: 24, fontWeight: 'bold' },
	headerButton: { padding: 4 },

	tabContainer: {
		paddingTop: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB',
	},
	tabsWrapper: { flexDirection: 'row' },
	tab: { flex: 1, alignItems: 'center', paddingBottom: 16 },
	tabText: { color: '#9CA3AF', fontSize: 16 },
	activeTabText: { color: COLORS.primary, fontWeight: '500' },
	activeTabIndicator: {
		position: 'absolute',
		bottom: 0,
		left: 16,
		right: 16,
		height: 4,
		backgroundColor: COLORS.primary,
		borderTopLeftRadius: 4,
		borderTopRightRadius: 4,
	},

	emptyState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	plantIllustration: { width: 192, height: 192, position: 'relative' },
	plantPot: {
		position: 'absolute',
		bottom: 32,
		left: '50%',
		marginLeft: -32,
		width: 64,
		height: 64,
		backgroundColor: '#CC7154',
		borderRadius: 8,
	},
	plantLeaves: {
		position: 'absolute',
		bottom: 96,
		left: '50%',
		marginLeft: -48,
		width: 96,
		height: 128,
	},
	leaf: {
		position: 'absolute',
		width: 32,
		height: 48,
		backgroundColor: '#34D399',
		borderRadius: 24,
	},
	leafLeft: { bottom: 0, left: 0, transform: [{ rotate: '-15deg' }] },
	leafMiddle: { bottom: 16, left: 16, height: 64 },
	leafRight: { bottom: 0, right: 0, transform: [{ rotate: '15deg' }] },
	sparkle: { position: 'absolute', fontSize: 24, color: '#FBBF24' },
	sparkleTopLeft: { top: 0, left: 0 },
	sparkleTopRight: { top: 32, right: 0 },
	sparkleBottom: { bottom: 80, left: 0 },

	inlinePromoContainer: { padding: 16 },
	inlinePromoCard: {
		padding: 16,
		borderRadius: 12,
		backgroundColor: '#F9FAFB',
		position: 'relative',
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.1,
				shadowRadius: 4,
			},
			android: { elevation: 4 },
		}),
	},
	promoCloseButton: {
		position: 'absolute',
		top: 8,
		right: 8,
		padding: 4,
	},
	promoTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
	promoDescription: { fontSize: 14, color: '#4B5563', marginBottom: 16, textAlign: 'center' },

	modalOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '80%',
		backgroundColor: '#FFF',
		borderRadius: 12,
		padding: 16,
	},
	modalCloseButton: { position: 'absolute', top: 8, right: 8 },
	modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
	modalText: { fontSize: 16, color: '#4B5563', lineHeight: 22 },
});

export default CareSchedule;
