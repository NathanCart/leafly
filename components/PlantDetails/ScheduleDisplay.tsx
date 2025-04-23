import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Droplet, Leaf, CalendarDays, AlertCircle } from 'lucide-react-native';
import { COLORS } from '@/app/constants/colors';
import { Text } from '@/components/Text';

type ScheduleSettings = {
	watering: {
		enabled: boolean;
		days: number;
		reminderEnabled: boolean;
	};
	fertilizing: {
		enabled: boolean;
		days: number;
		reminderEnabled: boolean;
	};
};

type ScheduleDisplayProps = {
	scheduleSettings?: ScheduleSettings;
	onPress: () => void;
};

const getHumanReadableFrequency = (days: number): string => {
	if (days === 1) return 'Every day';
	return `Every ${days} days`;
};

export const ScheduleDisplay = ({ scheduleSettings, onPress }: ScheduleDisplayProps) => {
	const hasSchedules =
		scheduleSettings &&
		(scheduleSettings.watering.enabled || scheduleSettings.fertilizing.enabled);

	if (!scheduleSettings) {
		return (
			<TouchableOpacity style={styles.emptyContainer} onPress={onPress}>
				<View style={styles.placeholderContent}>
					<CalendarDays size={24} color={COLORS.text.secondary.light} />
					<Text style={styles.placeholderText}>Set watering & fertilizing schedules</Text>
				</View>
			</TouchableOpacity>
		);
	}

	return (
		<TouchableOpacity style={styles.container} onPress={onPress}>
			{!hasSchedules ? (
				<View style={styles.placeholderContent}>
					<CalendarDays size={24} color={COLORS.text.secondary.light} />
					<Text style={styles.placeholderText}>Set watering & fertilizing schedules</Text>
				</View>
			) : (
				<>
					{scheduleSettings.watering.enabled && (
						<View style={styles.scheduleItem}>
							<View style={[styles.iconContainer, styles.wateringIcon]}>
								<Droplet size={16} color="#fff" />
							</View>
							<View style={styles.scheduleInfo}>
								<Text style={styles.scheduleTitle}>Watering</Text>
								<Text style={styles.scheduleFrequency}>
									{getHumanReadableFrequency(scheduleSettings.watering.days)}
								</Text>
							</View>
							{scheduleSettings.watering.reminderEnabled && (
								<View style={styles.reminderBadge}>
									<AlertCircle size={12} color="#33A1FF" />
								</View>
							)}
						</View>
					)}

					{scheduleSettings.fertilizing.enabled && (
						<View style={styles.scheduleItem}>
							<View style={[styles.iconContainer, styles.fertilizingIcon]}>
								<Leaf size={16} color="#fff" />
							</View>
							<View style={styles.scheduleInfo}>
								<Text style={styles.scheduleTitle}>Fertilizing</Text>
								<Text style={styles.scheduleFrequency}>
									{getHumanReadableFrequency(scheduleSettings.fertilizing.days)}
								</Text>
							</View>
							{scheduleSettings.fertilizing.reminderEnabled && (
								<View style={styles.reminderBadge}>
									<AlertCircle size={12} color="#4CAF50" />
								</View>
							)}
						</View>
					)}
				</>
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: COLORS.card.light,
		borderRadius: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	emptyContainer: {
		backgroundColor: COLORS.card.light,
		borderRadius: 16,
		padding: 16,

		borderWidth: 2,
		borderColor: COLORS.border,
	},
	placeholderContent: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
	},
	placeholderText: {
		marginTop: 8,
		fontSize: 14,
		color: COLORS.text.secondary.light,
		fontWeight: '500',
	},
	scheduleItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	iconContainer: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	wateringIcon: {
		backgroundColor: '#33A1FF',
	},
	fertilizingIcon: {
		backgroundColor: '#4CAF50',
	},
	scheduleInfo: {
		flex: 1,
	},
	scheduleTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: COLORS.text.primary.light,
	},
	scheduleFrequency: {
		fontSize: 12,
		color: COLORS.text.secondary.light,
	},
	reminderBadge: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: 'rgba(0,0,0,0.05)',
		justifyContent: 'center',
		alignItems: 'center',
	},
});
