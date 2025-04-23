import { COLORS } from '@/app/constants/colors';
import { Button } from '@/components/Button';
import { PlantIdSuggestionRaw } from '@/types/plants';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Dice6, Image as ImageIcon, Leaf, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
	ActivityIndicator,
	Animated,
	Easing,
	Image,
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { SuccessAnimation } from './SuccessAnimation';

interface Props {
	visible: boolean;
	onClose: () => void;
	plant: PlantIdSuggestionRaw;
	onConfirm: (nickname: string, imageUri?: string) => Promise<void>;
	isDark: boolean;
}

export function AddPlantModal({ visible, onClose, plant, onConfirm, isDark }: Props) {
	const [nickname, setNickname] = useState('');
	const [hasError, setHasError] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [customImage, setCustomImage] = useState<string | null>(null);

	const spinValue = useRef(new Animated.Value(0)).current;
	const inputScaleValue = useRef(new Animated.Value(1)).current;
	const shakeAnimation = useRef(new Animated.Value(0)).current;
	const isSpinning = useRef(false);
	const hapticInterval = useRef<NodeJS.Timeout | null>(null);

	const currentImage = customImage || plant.capturedImageUri;

	const pickImage = async () => {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.6,
			});
			if (!result.canceled && result.assets[0].uri) {
				setCustomImage(result.assets[0].uri);
				if (Platform.OS !== 'web') {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				}
			}
		} catch (err) {
			console.error('Error picking image:', err);
		}
	};

	const triggerHaptics = () => {
		if (Platform.OS === 'web') return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		if (hapticInterval.current) clearInterval(hapticInterval.current);
		hapticInterval.current = setInterval(() => {
			if (isSpinning.current) {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			}
		}, 100);
		setTimeout(() => {
			if (hapticInterval.current) clearInterval(hapticInterval.current);
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		}, 800);
	};

	const generateRandomNickname = () => {
		isSpinning.current = true;
		triggerHaptics();
		Animated.timing(spinValue, {
			toValue: 4,
			duration: 800,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}).start(() => {
			spinValue.setValue(0);
			isSpinning.current = false;
		});
		Animated.sequence([
			Animated.timing(inputScaleValue, {
				toValue: 1.05,
				duration: 100,
				easing: Easing.bounce,
				useNativeDriver: true,
			}),
			Animated.timing(inputScaleValue, {
				toValue: 1,
				duration: 100,
				easing: Easing.bounce,
				useNativeDriver: true,
			}),
		]).start();
		const randomName = uniqueNamesGenerator({
			dictionaries: [adjectives, colors, animals],
			length: 2,
			separator: ' ',
			style: 'capital',
		});
		setNickname(randomName);
		setHasError(false);
	};

	const shake = () => {
		Animated.sequence([
			Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
			Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
			Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
			Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
		]).start();
		if (Platform.OS !== 'web') {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		}
	};

	const spin = spinValue.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '1440deg'],
	});

	const handleConfirm = async () => {
		if (!nickname.trim()) {
			setHasError(true);
			shake();
			return;
		}
		setHasError(false);

		try {
			setShowSuccess(true);
		} catch (err) {
			console.error('Failed to add plant:', err);
			// Optionally handle error UI here
		} finally {
			setIsLoading(false);
		}
	};

	const handleAnimationComplete = () => {
		onConfirm(nickname, currentImage);

		setShowSuccess(false);
		onClose();

		router.push('/(tabs)/collection');
	};

	const handleChangeText = (text: string) => {
		setNickname(text);
		if (text.trim()) {
			setHasError(false);
		}
	};

	return (
		<Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.container}
			>
				<ScrollView
					contentContainerStyle={{ flexGrow: 1 }}
					keyboardDismissMode="on-drag"
					style={[
						styles.container,
						{ backgroundColor: isDark ? '#121212' : '#FFFFFF', flex: 1 },
					]}
				>
					{showSuccess && (
						<SuccessAnimation onAnimationComplete={handleAnimationComplete} />
					)}

					{isLoading && !showSuccess && (
						<View style={styles.loaderOverlay}>
							<ActivityIndicator size="large" color={COLORS.primary} />
						</View>
					)}

					<TouchableOpacity
						style={[styles.closeButton, { top: Platform.OS === 'ios' ? 50 : 20 }]}
						onPress={onClose}
					>
						<X color="white" size={24} />
					</TouchableOpacity>

					<View style={styles.content}>
						<TouchableOpacity
							style={styles.imageContainer}
							onPress={pickImage}
							activeOpacity={0.8}
						>
							<Image source={{ uri: currentImage }} style={styles.plantImage} />
							<View
								style={[
									styles.imageOverlay,
									{ backgroundColor: 'rgba(0,0,0,0.3)' },
								]}
							>
								<ImageIcon color="white" size={24} />
								<Text style={styles.changePhotoText}>Change Photo</Text>
							</View>
							<View
								style={[
									styles.editIndicator,
									{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
								]}
							>
								<ImageIcon color={COLORS.primary} size={20} />
							</View>
							<View
								style={[
									styles.plantBadge,
									{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
								]}
							>
								<Leaf color={COLORS.primary} size={20} />
								<Text
									style={[
										styles.plantBadgeText,
										{ color: isDark ? '#E0E0E0' : '#283618' },
									]}
								>
									{plant.name}
								</Text>
							</View>
						</TouchableOpacity>

						<View style={styles.form}>
							<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
								Name Your Plant
							</Text>
							<Text
								style={[styles.subtitle, { color: isDark ? '#BBBBBB' : '#555555' }]}
							>
								Give your new plant friend a unique name
							</Text>

							<View style={styles.inputContainer}>
								<View style={styles.nicknameInputContainer}>
									<Animated.View
										style={[
											styles.inputWrapper,
											{
												transform: [
													{ scale: inputScaleValue },
													{ translateX: shakeAnimation },
												],
											},
										]}
									>
										<TextInput
											style={[
												styles.input,
												{
													backgroundColor: hasError
														? isDark
															? '#3A2A2A'
															: '#FFE8E0'
														: isDark
														? '#2A2A2A'
														: '#fff',
													color: isDark ? '#E0E0E0' : '#283618',
													borderColor: hasError
														? '#D27D4C'
														: 'transparent',
													borderWidth: hasError ? 1 : 0,
												},
											]}
											placeholder="Give me a name"
											placeholderTextColor={
												hasError ? '#D27D4C' : isDark ? '#888' : '#999'
											}
											value={nickname}
											onChangeText={handleChangeText}
										/>
										{hasError && (
											<Text style={[styles.errorText, { color: '#D27D4C' }]}>
												Please give your plant a name
											</Text>
										)}
									</Animated.View>
									<TouchableOpacity
										style={[
											styles.diceButton,
											{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
										]}
										onPress={generateRandomNickname}
										activeOpacity={0.8}
									>
										<Animated.View style={{ transform: [{ rotate: spin }] }}>
											<Dice6 size={24} color={COLORS.primary} />
										</Animated.View>
									</TouchableOpacity>
								</View>
							</View>

							<View
								style={[
									styles.reminderCard,
									{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
								]}
							>
								<View
									style={[
										styles.reminderIconContainer,
										{ backgroundColor: isDark ? '#1A2A20' : '#FFFFFF' },
									]}
								>
									<Leaf size={24} color={COLORS.primary} />
								</View>
								<View style={[styles.reminderContent]}>
									<Text
										style={[
											styles.reminderTitle,
											{ color: isDark ? '#E0E0E0' : '#283618' },
										]}
									>
										SMART REMINDERS
									</Text>
									<Text
										style={[
											styles.reminderText,
											{ color: isDark ? '#BBBBBB' : '#555555' },
										]}
									>
										Let&apos;s find the watering rhythm
									</Text>
								</View>
							</View>
						</View>

						<View style={styles.buttonContainer}>
							<Button
								onPress={handleConfirm}
								fullWidth
								size="large"
								disabled={isLoading}
							>
								Add Plant
							</Button>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loaderOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 20,
	},
	closeButton: {
		position: 'absolute',
		left: 20,
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	content: {
		flex: 1,
		paddingTop: Platform.OS === 'ios' ? 100 : 70,
		paddingHorizontal: 20,
		alignItems: 'center',
	},
	imageContainer: {
		position: 'relative',
		marginBottom: 32,
	},
	plantImage: {
		width: 180,
		height: 180,
		borderRadius: 90,
	},
	imageOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: 90,
		justifyContent: 'center',
		alignItems: 'center',
		opacity: 0,
	},
	changePhotoText: {
		color: 'white',
		fontSize: 14,
		fontWeight: '600',
		marginTop: 8,
	},
	editIndicator: {
		position: 'absolute',
		top: 10,
		right: 10,
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	plantBadge: {
		position: 'absolute',
		bottom: -20,
		left: '50%',
		transform: [{ translateX: -80 }],
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		gap: 8,
		width: 160,
	},
	plantBadgeText: {
		fontSize: 14,
		fontWeight: '600',
	},
	form: {
		width: '100%',
		alignItems: 'center',
		gap: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 16,
		textAlign: 'center',
	},
	inputContainer: {
		width: '100%',
		gap: 8,
	},
	nicknameInputContainer: {
		flexDirection: 'row',
		gap: 12,
	},
	inputWrapper: {
		flex: 1,
	},
	input: {
		height: 56,
		borderRadius: 16,
		paddingHorizontal: 16,
		fontSize: 16,
	},
	errorText: {
		fontSize: 12,
		marginTop: 4,
		marginLeft: 4,
	},
	diceButton: {
		width: 56,
		height: 56,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	reminderCard: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 16,
		padding: 16,
	},
	reminderIconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	reminderContent: {
		flex: 1,
	},
	reminderTitle: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 4,
	},
	reminderText: {
		fontSize: 16,
		fontWeight: '500',
	},
	buttonContainer: {
		position: 'absolute',
		bottom: Platform.OS === 'ios' ? 20 : 20,
		left: 20,
		right: 20,
	},
});
