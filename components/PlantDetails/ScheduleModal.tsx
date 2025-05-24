import React, { useRef, useState } from 'react';
import {
	View,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Switch,
	TextInput,
	NativeSyntheticEvent,
	NativeScrollEvent,
} from 'react-native';
import RNModal from 'react-native-modal';
import { X, Droplet, Leaf, Sparkles } from 'lucide-react-native';

import { COLORS } from '@/app/constants/colors';
import { Button } from '../Button';
import { Plant } from '@/data/plants';
import { Text } from '@/components/Text';
import { useRevenuecat } from '@/hooks/useRevenuecat';

/* ────────────────────────────────────────────────────────── */

export type ScheduleSettings = {
	watering: { enabled: boolean; days: number | null; autoSchedule: boolean };
	fertilizing: { enabled: boolean; days: number | null; autoSchedule: boolean };
};

type Props = {
	visible: boolean;
	onClose: () => void;
	onSave: (settings: ScheduleSettings) => void;
	initialSettings?: ScheduleSettings;
	isDark?: boolean;
	plant: Plant;
};

export const ScheduleModal = ({
	visible,
	onClose,
	onSave,
	initialSettings,
	isDark = false,
	plant,
}: Props) => {
	/* ───────── state ───────── */

	const { proAction } = useRevenuecat({ offering: 'pips' });

	// default schedule values (falls back to 7/30 if the plant has none)
	const defaultSettings: ScheduleSettings = {
		watering: {
			enabled: !!plant.watering_interval_days,
			days: plant.watering_interval_days || 7,
			autoSchedule: false,
		},
		fertilizing: {
			enabled: !!plant.fertilize_interval_days,
			days: plant.fertilize_interval_days || 30,
			autoSchedule: false,
		},
	};
	const [settings, setSettings] = useState<ScheduleSettings>(initialSettings || defaultSettings);

	/* ───────── NEW: Scroll-view integration ───────── */
	const [scrollOffset, setScrollOffset] = useState(0);
	const scrollViewRef = useRef<ScrollView>(null);

	const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		setScrollOffset(e.nativeEvent.contentOffset.y);
	};

	/* ───────── helpers ───────── */
	const updateWatering = (u: Partial<typeof settings.watering>) =>
		setSettings((s) => ({
			...s,
			watering: {
				...s.watering,
				...u,
				days: u.autoSchedule ? 7 : u.days ?? s.watering.days,
			},
		}));

	const updateFertilizing = (u: Partial<typeof settings.fertilizing>) =>
		setSettings((s) => ({
			...s,
			fertilizing: {
				...s.fertilizing,
				...u,
				days: u.autoSchedule ? 30 : u.days ?? s.fertilizing.days,
			},
		}));

	const textColor = isDark ? COLORS.text.primary.dark : COLORS.text.primary.light;
	const surfaceColor = isDark ? COLORS.surface.dark : COLORS.surface.light;

	/* ───────── render ───────── */
	return (
		<RNModal
			isVisible={visible}
			onBackdropPress={onClose}
			onBackButtonPress={onClose}
			onSwipeComplete={onClose}
			swipeDirection="down"
			propagateSwipe
			/* These three props stop the sheet from closing while you scroll */
			scrollTo={(p) => scrollViewRef.current?.scrollTo(p)}
			scrollOffset={scrollOffset}
			scrollOffsetMax={9999} // big number → “let me scroll as far as my content allows”
			style={styles.modal}
			backdropTransitionOutTiming={0}
		>
			<View style={[styles.sheet, { backgroundColor: surfaceColor }]}>
				{/* handle */}
				<View style={styles.handle} />

				{/* header */}
				<View style={styles.header}>
					<Text style={[styles.title, { color: textColor }]}>Care Schedule</Text>
					<TouchableOpacity onPress={onClose} style={styles.closeBtn}>
						<X size={24} color={textColor} />
					</TouchableOpacity>
				</View>

				{/* content */}
				<ScrollView
					ref={scrollViewRef}
					onScroll={handleScroll}
					scrollEventThrottle={16}
					style={styles.content}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 24 }}
				>
					{/* Watering section */}
					<SectionCard
						icon={<Droplet size={20} color="#33A1FF" fill="#33A1FF" />}
						title="Watering Schedule"
						switchValue={settings.watering.enabled}
						onSwitch={(v) => updateWatering({ enabled: v })}
						switchTrack="#33A1FF50"
						switchThumb="#33A1FF"
						enabled={settings.watering.enabled}
						autoValue={settings.watering.autoSchedule}
						onAutoSwitch={(v) => updateWatering({ autoSchedule: v })}
						onDaysChange={(d) => updateWatering({ days: d })}
						days={settings.watering.days}
						placeholder="7"
						textColor={textColor}
					/>

					{/* Fertilizing section */}
					<SectionCard
						icon={<Leaf size={20} color="#4CAF50" fill="#4CAF50" />}
						title="Fertilizing Schedule"
						switchValue={settings.fertilizing.enabled}
						onSwitch={(v) => updateFertilizing({ enabled: v })}
						switchTrack="#4CAF5050"
						switchThumb="#4CAF50"
						enabled={settings.fertilizing.enabled}
						autoValue={settings.fertilizing.autoSchedule}
						onAutoSwitch={(v) => updateFertilizing({ autoSchedule: v })}
						onDaysChange={(d) => updateFertilizing({ days: d })}
						days={settings.fertilizing.days}
						placeholder="30"
						textColor={textColor}
					/>
				</ScrollView>

				{/* footer */}
				<View style={styles.footer}>
					<Button
						variant="primary"
						onPress={() => {
							proAction(() => {
								onSave({
									watering: {
										enabled: settings.watering.enabled,
										days: settings.watering.enabled
											? settings.watering.days
											: null,
										autoSchedule: settings.watering.autoSchedule,
									},
									fertilizing: {
										enabled: settings.fertilizing.enabled,
										days: settings.fertilizing.enabled
											? settings.fertilizing.days
											: null,
										autoSchedule: settings.fertilizing.autoSchedule,
									},
								});
								onClose();
							});
						}}
					>
						Save
					</Button>
				</View>
			</View>
		</RNModal>
	);
};

/* ────────────────────────────
      Re-usable Section Card
   ──────────────────────────── */
const SectionCard = ({
	icon,
	title,
	switchValue,
	onSwitch,
	switchTrack,
	switchThumb,
	enabled,
	autoValue,
	onAutoSwitch,
	onDaysChange,
	days,
	placeholder,
	textColor,
}: {
	icon: React.ReactNode;
	title: string;
	switchValue: boolean;
	onSwitch: (v: boolean) => void;
	switchTrack: string;
	switchThumb: string;
	enabled: boolean;
	autoValue: boolean;
	onAutoSwitch: (v: boolean) => void;
	onDaysChange: (d: number) => void;
	days: number | null;
	placeholder: string;
	textColor: string;
}) => {
	return (
		<View style={styles.section}>
			{/* header row */}
			<View style={styles.sectionHeader}>
				<View style={styles.iconWrap}>{icon}</View>
				<Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
				<Switch
					value={switchValue}
					onValueChange={onSwitch}
					trackColor={{ false: '#767577', true: switchTrack }}
					thumbColor={switchValue ? switchThumb : '#f4f3f4'}
				/>
			</View>

			{enabled && (
				<View style={styles.options}>
					{/* auto row */}

					{/* custom interval row */}
					{!autoValue && (
						<View style={styles.customRow}>
							<Text style={[styles.optionLabel, { color: textColor }]}>
								Repeat every
							</Text>
							<TextInput
								style={styles.input}
								value={days?.toString() ?? ''}
								onChangeText={(t) => onDaysChange(Number(t))}
								keyboardType="number-pad"
								placeholder={placeholder}
								placeholderTextColor={COLORS.text.secondary.light}
							/>
							<Text style={styles.customUnit}>days</Text>
						</View>
					)}
				</View>
			)}
		</View>
	);
};

/* ──────────────────────────────────────────────────────────
                                Styles
   ────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
	/* react-native-modal wrapper: bottom-sheet */
	modal: { justifyContent: 'flex-end', margin: 0, minHeight: '80%', height: '100%' },

	/* sheet container */
	sheet: {
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		maxHeight: '80%',
		minHeight: '80%',
	},

	/* drag indicator */
	handle: {
		alignSelf: 'center',
		width: 44,
		height: 5,
		borderRadius: 3,
		backgroundColor: 'rgba(0,0,0,0.2)',
		marginTop: 8,
		marginBottom: 12,
	},

	/* header */
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 24,
		marginBottom: 16,
	},
	title: { fontSize: 20, fontWeight: '700' },
	closeBtn: { padding: 4 },

	/* content */
	content: { paddingHorizontal: 24 },

	/* footer */
	footer: { padding: 16 },

	section: {
		marginBottom: 24,
		backgroundColor: COLORS.card.light,
		borderRadius: 16,
		padding: 16,
		borderWidth: 2,
		borderColor: COLORS.border,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	iconWrap: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: 'rgba(0,0,0,0.05)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	sectionTitle: { flex: 1, fontSize: 16, fontWeight: '600' },

	/* option rows */
	options: { marginTop: 16 },
	optionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: 'rgba(0,0,0,0.03)',
		padding: 12,
		borderRadius: 12,
		marginBottom: 16,
	},
	optionLeft: { flexDirection: 'row', alignItems: 'center' },
	optionLabel: { fontSize: 14, fontWeight: '500', marginLeft: 8 },

	customRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.03)',
		padding: 12,
		borderRadius: 12,
	},
	input: {
		backgroundColor: 'rgba(0,0,0,0.05)',
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 6,
		width: 60,
		textAlign: 'center',
		color: COLORS.text.primary.light,
		marginHorizontal: 8,
	},
	customUnit: { fontSize: 14, color: COLORS.text.secondary.light },
});
