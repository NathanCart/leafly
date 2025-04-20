import React, { useState, useRef, useCallback } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Platform,
	StatusBar,
	Modal,
	Animated,
} from 'react-native';
import { HelpCircle, Leaf, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { COLORS } from '../constants/colors';

const CareSchedule = () => {
	const insets = useSafeAreaInsets();
	const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');
	const [showInfo, setShowInfo] = useState(false);

	// Example schedule items - in real use, pull from props or context
	const scheduleItems = []; // if non-empty, promo won't show

	const scaleAnim = useRef(new Animated.Value(0)).current;
	useFocusEffect(
		useCallback(() => {
			scaleAnim.setValue(0);
			Animated.spring(scaleAnim, {
				toValue: 1,
				friction: 5,
				useNativeDriver: true,
			}).start();
		}, [scaleAnim])
	);

	return (
		<View style={[styles.container, { paddingTop: insets.top + 8 }]}>
			<StatusBar barStyle="dark-content" />

			{/* Info Modal */}
			<Modal
				visible={showInfo}
				transparent
				animationType="fade"
				onRequestClose={() => setShowInfo(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<TouchableOpacity
							style={styles.modalCloseButton}
							onPress={() => setShowInfo(false)}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
			</Modal>

			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Leaf color={COLORS.tabBar.active} size={24} />
					<Text style={styles.headerTitle}>Care Schedule</Text>
				</View>
				<TouchableOpacity
					style={styles.headerButton}
					onPress={() => setShowInfo(true)}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<HelpCircle color="#000" size={24} />
				</TouchableOpacity>
			</View>

			{/* Tabs */}
			<View style={styles.tabContainer}>
				<View style={styles.tabsWrapper}>
					{['today', 'upcoming'].map((tabKey) => (
						<TouchableOpacity
							key={tabKey}
							onPress={() => setActiveTab(tabKey as any)}
							style={styles.tab}
							hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

			<View style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
				{/* Empty State with animation */}
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

				{/* Inline Promo Card, shown only if no schedule items */}
				{scheduleItems.length === 0 && (
					<View style={styles.inlinePromoCard}>
						<Text style={styles.promoTitle}>Smart Reminders</Text>
						<Text style={styles.promoDescription}>
							Get notified when your plants are ready for a nutrient boost!
						</Text>
						<Button variant="secondary" onPress={() => {}}>
							Set up
						</Button>
					</View>
				)}
			</View>
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
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 32,
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

	inlinePromoCard: {
		padding: 16,
		margin: 16,
		borderRadius: 12,
		backgroundColor: '#F9FAFB',
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
	promoTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
	promoDescription: { fontSize: 14, color: '#4B5563', marginBottom: 16 },

	modalOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: { width: '80%', backgroundColor: '#FFF', borderRadius: 12, padding: 16 },
	modalCloseButton: { position: 'absolute', top: 8, right: 8 },
	modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
	modalText: { fontSize: 16, color: '#4B5563', lineHeight: 22 },
});

export default CareSchedule;
