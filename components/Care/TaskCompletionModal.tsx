import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Modal,
	TouchableOpacity,
	Platform,
	Dimensions,
	StatusBar,
} from 'react-native';
import { X, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../Button';
import { TaskSuccessAnimation } from './TaskSuccessAnimation';
import { COLORS } from '@/app/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TaskCompletionModalProps = {
	visible: boolean;
	onClose: () => void;
	onComplete: () => Promise<void>;
	onDismissReminder?: () => void;
	plantName: string;
	taskType: 'Water' | 'Fertilize';
};

export const TaskCompletionModal = ({
	visible,
	onClose,
	onComplete,
	onDismissReminder,
	plantName,
	taskType,
}: TaskCompletionModalProps) => {
	const insets = useSafeAreaInsets();
	const [showSuccess, setShowSuccess] = useState(false);
	const isWatering = taskType === 'Water';
	const accentColor = isWatering ? '#33A1FF' : '#4CAF50';

	const handleComplete = () => {
		setShowSuccess(true);
	};

	const handleAnimationComplete = async () => {
		setShowSuccess(false);
		onClose();
		await onComplete();
	};

	const handleDismiss = () => {
		onClose();
		onComplete();
		if (onDismissReminder) {
			onDismissReminder();
		}
	};

	return (
		<Modal
			animationType="fade"
			presentationStyle="fullScreen"
			visible={visible}
			onRequestClose={onClose}
		>
			<StatusBar barStyle="dark-content" />
			<View style={[styles.modalContainer, { paddingTop: insets.top + 16 }]}>
				{!showSuccess ? (
					<>
						<TouchableOpacity
							onPress={onClose}
							style={[styles.closeButton, { top: insets.top + 16 }]}
							accessibilityLabel="Close modal"
						>
							<X size={24} color="#6B7280" />
						</TouchableOpacity>

						<View
							style={[styles.iconContainer, { backgroundColor: `${accentColor}20` }]}
						>
							<Calendar size={32} color={accentColor} />
						</View>

						<Text style={styles.title}>Complete Task</Text>
						<Text style={styles.description}>
							Mark {taskType.toLowerCase()} task as complete for {plantName}?
						</Text>

						<View style={styles.buttonRow}>
							<Button variant="secondary" onPress={onClose} style={styles.button}>
								Cancel
							</Button>
							<Button onPress={handleComplete} style={styles.button}>
								Complete
							</Button>
						</View>

						<TouchableOpacity
							onPress={handleDismiss}
							style={styles.dismissButton}
							activeOpacity={0.7}
							accessibilityLabel="Dismiss this task"
						>
							<Text style={styles.dismissText}>Dismiss Task</Text>
						</TouchableOpacity>
					</>
				) : (
					<TaskSuccessAnimation
						type={taskType}
						onAnimationComplete={handleAnimationComplete}
					/>
				)}
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		backgroundColor: '#FFF',
		paddingHorizontal: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	closeButton: {
		position: 'absolute',
		left: 16,
		padding: 10,
		zIndex: 1,
		borderRadius: 20,
		backgroundColor: '#F3F4F6',
	},
	iconContainer: {
		width: 72,
		height: 72,
		borderRadius: 36,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
	},
	title: {
		fontSize: 22,
		fontWeight: '700',
		color: '#111827',
		textAlign: 'center',
		marginBottom: 12,
	},
	description: {
		fontSize: 16,
		color: '#4B5563',
		textAlign: 'center',
		marginBottom: 32,
		lineHeight: 22,
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 0,
		marginBottom: 24,
	},
	button: {
		flex: 1,
		marginHorizontal: 6,
	},
	dismissButton: {
		alignItems: 'center',
		paddingVertical: 14,
		paddingHorizontal: 16,
		position: 'absolute',
		bottom: 16,
		width: SCREEN_WIDTH - 48,
		borderRadius: 12,
		backgroundColor: '#FEE2E2',
	},
	dismissText: {
		fontSize: 16,
		fontWeight: '600',
		color: COLORS.error,
	},
});
