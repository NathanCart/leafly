import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Modal,
	TouchableOpacity,
	Platform,
	Dimensions,
} from 'react-native';
import { X, Calendar } from 'lucide-react-native';
import { Button } from '../Button';
import { TaskSuccessAnimation } from './TaskSuccessAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TaskCompletionModalProps = {
	visible: boolean;
	onClose: () => void;
	onComplete: () => void;
	plantName: string;
	taskType: 'Water' | 'Fertilize';
};

export const TaskCompletionModal = ({
	visible,
	onClose,
	onComplete,
	plantName,
	taskType,
}: TaskCompletionModalProps) => {
	const [showSuccess, setShowSuccess] = useState(false);
	const isWatering = taskType === 'Water';
	const accentColor = isWatering ? '#33A1FF' : '#4CAF50';

	const handleComplete = async () => {
		setShowSuccess(true);
	};

	const handleAnimationComplete = async () => {
		setShowSuccess(false);

		onClose();
		await onComplete();
	};

	return (
		<Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
			<View style={styles.modalOverlay}>
				{!showSuccess ? (
					<View style={styles.modalContainer}>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<X size={24} color="#6B7280" />
						</TouchableOpacity>

						<View style={styles.iconContainer}>
							<Calendar size={32} color={accentColor} />
						</View>

						<Text style={styles.title}>Complete Task</Text>
						<Text style={styles.description}>
							Mark {taskType.toLowerCase()} task as complete for {plantName}?
						</Text>

						<View style={styles.buttonContainer}>
							<Button variant="secondary" onPress={onClose} style={styles.button}>
								Cancel
							</Button>
							<Button onPress={handleComplete} style={[styles.button]}>
								Complete
							</Button>
						</View>
					</View>
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
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	modalContainer: {
		width: '100%',
		maxWidth: Math.min(400, SCREEN_WIDTH - 32),
		backgroundColor: '#FFF',
		borderRadius: 16,
		padding: 24,
		alignItems: 'center',
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
	closeButton: {
		position: 'absolute',
		right: 16,
		top: 16,
		padding: 4,
	},
	iconContainer: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: '#F3F4F6',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 8,
	},
	description: {
		fontSize: 16,
		color: '#4B5563',
		textAlign: 'center',
		marginBottom: 24,
	},
	buttonContainer: {
		flexDirection: 'row',
		gap: 8,
		width: '100%',
	},
	button: {
		flex: 1,
	},
});
