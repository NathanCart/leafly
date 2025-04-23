import React, { useState, useEffect } from 'react';
import {
	View,
	StyleSheet,
	Modal,
	TouchableOpacity,
	ScrollView,
	Switch,
	TextInput,
} from 'react-native';
import { X, Droplet, Leaf, Bell, Sparkles } from 'lucide-react-native';
import { COLORS } from '@/app/constants/colors';
import { Button } from '../Button';
import { Plant } from '@/data/plants';
import { Text } from '@/components/Text';

export type ScheduleSettings = {
	watering: {
		enabled: boolean;
		days: number | null;
		autoSchedule: boolean;
	};
	fertilizing: {
		enabled: boolean;
		days: number | null;
		autoSchedule: boolean;
	};
};

type ScheduleModalProps = {
	visible: boolean;
	onClose: () => void;
	onSave: (scheduleSettings: ScheduleSettings) => void;
	initialSettings?: ScheduleSettings;
	isDark?: boolean;
	plant: Plant;
};

export const ScheduleModal = ({
	visible,
	onClose,
	onSave,
	initialSettings,
	isDark,
	plant,
}: ScheduleModalProps) => {
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

	const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>(
		initialSettings || defaultSettings
	);

	const updateWateringSettings = (updates: Partial<typeof scheduleSettings.watering>) => {
		setScheduleSettings({
			...scheduleSettings,
			watering: {
				...scheduleSettings.watering,
				...updates,
				// If auto schedule is enabled, set recommended days
				days: updates.autoSchedule ? 7 : updates.days ?? scheduleSettings.watering.days,
			},
		});
	};

	const updateFertilizingSettings = (updates: Partial<typeof scheduleSettings.fertilizing>) => {
		setScheduleSettings({
			...scheduleSettings,
			fertilizing: {
				...scheduleSettings.fertilizing,
				...updates,
				// If auto schedule is enabled, set recommended days
				days: updates.autoSchedule ? 30 : updates.days ?? scheduleSettings.fertilizing.days,
			},
		});
	};

	const textColor = isDark ? COLORS.text.primary.dark : COLORS.text.primary.light;
	const surfaceColor = isDark ? COLORS.surface.dark : COLORS.surface.light;

	return (
		<Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
			<View style={styles.modalOverlay}>
				<View style={[styles.modalContainer, { backgroundColor: surfaceColor }]}>
					<View style={styles.modalHeader}>
						<Text style={[styles.modalTitle, { color: textColor }]}>Care Schedule</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<X size={24} color={textColor} />
						</TouchableOpacity>
					</View>

					<ScrollView style={styles.modalContent}>
						{/* Watering Schedule */}
						<View style={styles.scheduleSection}>
							<View style={styles.sectionHeader}>
								<View style={styles.sectionIconContainer}>
									<Droplet fill="#33A1FF" size={20} color="#33A1FF" />
								</View>
								<Text style={[styles.sectionTitle, { color: textColor }]}>
									Watering Schedule
								</Text>
								<Switch
									value={scheduleSettings.watering.enabled}
									onValueChange={(value) =>
										updateWateringSettings({ enabled: value })
									}
									trackColor={{ false: '#767577', true: '#33A1FF50' }}
									thumbColor={
										scheduleSettings.watering.enabled ? '#33A1FF' : '#f4f3f4'
									}
								/>
							</View>

							{scheduleSettings.watering.enabled && (
								<View style={styles.scheduleOptions}>
									<View style={styles.optionRow}>
										<TouchableOpacity
											style={styles.autoScheduleRow}
											onPress={() =>
												updateWateringSettings({
													autoSchedule:
														!scheduleSettings.watering.autoSchedule,
												})
											}
										>
											<View style={styles.autoScheduleLeft}>
												<Sparkles
													fill="#33A1FF"
													size={18}
													color="#33A1FF"
												/>
												<Text
													style={[
														styles.optionLabel,
														{ color: textColor },
													]}
												>
													Let us decide
												</Text>
											</View>
											<Switch
												value={scheduleSettings.watering.autoSchedule}
												onValueChange={(value) =>
													updateWateringSettings({ autoSchedule: value })
												}
												trackColor={{ false: '#767577', true: '#33A1FF50' }}
												thumbColor={
													scheduleSettings.watering.autoSchedule
														? '#33A1FF'
														: '#f4f3f4'
												}
											/>
										</TouchableOpacity>
									</View>

									{!scheduleSettings.watering.autoSchedule && (
										<View style={styles.optionRow}>
											<View style={styles.customDaysContainer}>
												<Text
													style={[
														styles.optionLabel,
														{ color: textColor },
													]}
												>
													Repeat every
												</Text>
												<TextInput
													style={styles.customDaysInput}
													value={scheduleSettings?.watering?.days?.toString()}
													onChangeText={(text) =>
														updateWateringSettings({
															days: Number(text),
														})
													}
													keyboardType="number-pad"
													placeholder="7"
													placeholderTextColor={
														COLORS.text.secondary.light
													}
												/>
												<Text style={styles.customDaysLabel}>days</Text>
											</View>
										</View>
									)}
								</View>
							)}
						</View>

						{/* Fertilizing Schedule */}
						<View style={styles.scheduleSection}>
							<View style={styles.sectionHeader}>
								<View style={styles.sectionIconContainer}>
									<Leaf size={20} color="#4CAF50" fill="#4CAF50" />
								</View>
								<Text style={[styles.sectionTitle, { color: textColor }]}>
									Fertilizing Schedule
								</Text>
								<Switch
									value={scheduleSettings.fertilizing.enabled}
									onValueChange={(value) =>
										updateFertilizingSettings({ enabled: value })
									}
									trackColor={{ false: '#767577', true: '#4CAF5050' }}
									thumbColor={
										scheduleSettings.fertilizing.enabled ? '#4CAF50' : '#f4f3f4'
									}
								/>
							</View>

							{scheduleSettings.fertilizing.enabled && (
								<View style={styles.scheduleOptions}>
									<View style={styles.optionRow}>
										<TouchableOpacity
											style={styles.autoScheduleRow}
											onPress={() =>
												updateFertilizingSettings({
													autoSchedule:
														!scheduleSettings.fertilizing.autoSchedule,
												})
											}
										>
											<View style={styles.autoScheduleLeft}>
												<Sparkles
													size={18}
													color="#4CAF50"
													fill="#4CAF50"
												/>
												<Text
													style={[
														styles.optionLabel,
														{ color: textColor },
													]}
												>
													Let us decide
												</Text>
											</View>
											<Switch
												value={scheduleSettings.fertilizing.autoSchedule}
												onValueChange={(value) =>
													updateFertilizingSettings({
														autoSchedule: value,
													})
												}
												trackColor={{ false: '#767577', true: '#4CAF5050' }}
												thumbColor={
													scheduleSettings.fertilizing.autoSchedule
														? '#4CAF50'
														: '#f4f3f4'
												}
											/>
										</TouchableOpacity>
									</View>

									{!scheduleSettings.fertilizing.autoSchedule && (
										<View style={styles.optionRow}>
											<View style={styles.customDaysContainer}>
												<Text
													style={[
														styles.optionLabel,
														{ color: textColor },
													]}
												>
													Repeat every
												</Text>
												<TextInput
													style={styles.customDaysInput}
													value={scheduleSettings?.fertilizing?.days?.toString()}
													onChangeText={(text) =>
														updateFertilizingSettings({
															days: Number(text),
														})
													}
													keyboardType="number-pad"
													placeholder="30"
													placeholderTextColor={
														COLORS.text.secondary.light
													}
												/>
												<Text style={styles.customDaysLabel}>days</Text>
											</View>
										</View>
									)}
								</View>
							)}
						</View>
					</ScrollView>
					<View style={{ padding: 16 }}>
						<Button
							variant="primary"
							onPress={() => {
								onSave({
									fertilizing: {
										enabled: scheduleSettings.fertilizing.enabled,
										days: !!scheduleSettings.fertilizing.enabled
											? scheduleSettings.fertilizing.days
											: null,
										autoSchedule: scheduleSettings.fertilizing.autoSchedule,
									},
									watering: {
										enabled: scheduleSettings.watering.enabled,
										days: !!scheduleSettings.watering.enabled
											? scheduleSettings.watering.days
											: null,
										autoSchedule: scheduleSettings.watering.autoSchedule,
									},
								});
								onClose();
							}}
						>
							Save
						</Button>
					</View>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	modalContainer: {
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingTop: 24,
		backgroundColor: COLORS.surface.light,
		maxHeight: '80%',
		height: '80%',
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 24,
		marginBottom: 16,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: COLORS.text.primary.light,
	},
	closeButton: {
		padding: 4,
	},
	modalContent: {
		paddingHorizontal: 24,
	},
	scheduleSection: {
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
	sectionIconContainer: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: 'rgba(0,0,0,0.05)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	sectionTitle: {
		flex: 1,
		fontSize: 16,
		fontWeight: '600',
		color: COLORS.text.primary.light,
	},
	scheduleOptions: {
		marginTop: 16,
	},
	optionRow: {
		marginBottom: 16,
	},
	autoScheduleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: 'rgba(0,0,0,0.03)',
		padding: 12,
		borderRadius: 12,
	},
	autoScheduleLeft: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	reminderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: 'rgba(0,0,0,0.03)',
		padding: 12,
		borderRadius: 12,
	},
	reminderLeft: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	optionLabel: {
		fontSize: 14,
		fontWeight: '500',
		marginLeft: 8,
		color: COLORS.text.primary.light,
	},
	customDaysContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: 'rgba(0,0,0,0.03)',
		padding: 12,
		borderRadius: 12,
	},
	customDaysInput: {
		backgroundColor: 'rgba(0,0,0,0.05)',
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 6,
		width: 60,
		textAlign: 'center',
		color: COLORS.text.primary.light,
	},
	customDaysLabel: {
		fontSize: 14,
		color: COLORS.text.secondary.light,
	},
});
