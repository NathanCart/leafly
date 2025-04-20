// EditPlantModal.tsx — styled to match AddPlantModal UI, with indoor/outdoor select, haptics on dice, and success animation
import React, { useEffect, useRef, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Modal,
	Image,
	TextInput,
	TouchableOpacity,
	Platform,
	Animated,
	Easing,
} from 'react-native';
import { X, Leaf, Dice6, Image as ImageIcon, MapPin } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { COLORS } from '@/app/constants/colors';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { SuccessAnimation } from '../PlantIdentification/SuccessAnimation';

interface EditPlantModalProps {
	visible: boolean;
	onClose: () => void;
	onSave: (updates: {
		nickname: string;
		location: 'Indoor' | 'Outdoor';
		imageUri?: string;
	}) => void;
	plant: {
		nickname?: string | null;
		name: string;
		image_url: string;
		location?: 'Indoor' | 'Outdoor';
	} | null;
	isDark: boolean;
}

export function EditPlantModal({ visible, onClose, onSave, plant, isDark }: EditPlantModalProps) {
	if (!plant) return null;

	// Local state
	const [nickname, setNickname] = useState(plant.nickname || '');
	const [location, setLocation] = useState<'Indoor' | 'Outdoor'>(plant.location || 'Indoor');
	const [customImage, setCustomImage] = useState<string | null>(null);
	const [hasError, setHasError] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	// Animations
	const spinValue = useRef(new Animated.Value(0)).current;
	const inputScale = useRef(new Animated.Value(1)).current;
	const shakeAnim = useRef(new Animated.Value(0)).current;

	// Sync local state when modal opens
	useEffect(() => {
		if (visible) {
			setNickname(plant.nickname || '');
			setLocation(plant.location || 'Indoor');
			setCustomImage(null);
			setHasError(false);
			setShowSuccess(false);
		}
	}, [visible, plant]);

	const currentImage = customImage || plant.image_url;

	const triggerHaptics = () => {
		if (Platform.OS !== 'web') {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			const interval = setInterval(
				() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
				100
			);
			setTimeout(() => clearInterval(interval), 800);
		}
	};

	const randomize = () => {
		triggerHaptics();
		Animated.timing(spinValue, {
			toValue: 1,
			duration: 800,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}).start(() => spinValue.setValue(0));

		Animated.sequence([
			Animated.timing(inputScale, { toValue: 1.05, duration: 100, useNativeDriver: true }),
			Animated.timing(inputScale, { toValue: 1, duration: 100, useNativeDriver: true }),
		]).start();

		const name = uniqueNamesGenerator({
			dictionaries: [adjectives, colors, animals],
			length: 2,
			style: 'capital',
		});
		setNickname(name);
		setHasError(false);
	};
	const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1440deg'] });

	const pickImage = async () => {
		try {
			const res = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 1,
			});
			if (!res.canceled && res.assets[0].uri) {
				setCustomImage(res.assets[0].uri);
				if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			}
		} catch (e) {
			console.error(e);
		}
	};

	const shake = () => {
		Animated.sequence([
			Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
			Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
			Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
			Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
		]).start(
			() =>
				Platform.OS !== 'web' &&
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
		);
	};

	const handleSave = () => {
		if (!nickname.trim()) {
			setHasError(true);
			shake();
			return;
		}
		setShowSuccess(true);
	};

	const finish = () => {
		setShowSuccess(false);
		onSave({ nickname: nickname.trim(), location, imageUri: customImage || undefined });
		onClose();
	};

	return (
		<Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
			<View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
				{showSuccess && (
					<SuccessAnimation onAnimationComplete={finish} title="Plant Edited!" />
				)}

				<TouchableOpacity
					style={[styles.closeBtn, { top: Platform.OS === 'ios' ? 50 : 20 }]}
					onPress={onClose}
				>
					<X color="#FFF" size={24} />
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.imageContainer}
					onPress={pickImage}
					activeOpacity={0.8}
				>
					<Image source={{ uri: currentImage }} style={styles.avatar} />
					<View style={styles.overlayContainer}>
						<ImageIcon color="#FFF" size={24} />
						<Text style={styles.overlayText}>Change Photo</Text>
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
							style={[styles.badgeText, { color: isDark ? '#E0E0E0' : '#283618' }]}
							numberOfLines={1}
						>
							{plant.name}
						</Text>
					</View>
				</TouchableOpacity>

				<View style={styles.form}>
					<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
						Edit Nickname
					</Text>
					<Text style={[styles.subtitle, { color: isDark ? '#BBBBBB' : '#555555' }]}>
						Give your plant a personal touch
					</Text>

					<View style={styles.inputRow}>
						<Animated.View
							style={{
								flex: 1,
								transform: [{ scale: inputScale }, { translateX: shakeAnim }],
							}}
						>
							<TextInput
								style={[
									styles.input,
									{
										backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
										color: isDark ? '#E0E0E0' : '#283618',
										borderColor: hasError ? '#D27D4C' : 'transparent',
										borderWidth: hasError ? 1 : 0,
									},
								]}
								placeholder="Enter nickname"
								placeholderTextColor={isDark ? '#888' : '#999'}
								value={nickname}
								onChangeText={(t) => {
									setNickname(t);
									if (t.trim()) setHasError(false);
								}}
							/>
							{hasError && (
								<Text style={[styles.errorText, { color: '#D27D4C' }]}>
									Please enter a nickname
								</Text>
							)}
						</Animated.View>
						<TouchableOpacity
							style={[
								styles.diceButton,
								{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
							]}
							onPress={randomize}
						>
							<Animated.View style={{ transform: [{ rotate: spin }] }}>
								<Dice6 size={24} color={COLORS.primary} />
							</Animated.View>
						</TouchableOpacity>
					</View>

					<View style={styles.locationSelect}>
						{(['Indoor', 'Outdoor'] as const).map((val) => (
							<TouchableOpacity
								key={val}
								style={[
									styles.locationButton,
									location === val && styles.locationButtonActive,
									{ backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' },
								]}
								onPress={() => setLocation(val)}
							>
								<MapPin
									size={20}
									color={
										location === val
											? COLORS.primary
											: isDark
											? '#BBBBBB'
											: '#555555'
									}
								/>
								<Text
									style={[
										styles.locationText,
										location === val && { color: COLORS.primary },
									]}
								>
									{val}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				<View style={styles.buttonContainer}>
					<Button onPress={handleSave} fullWidth size="large">
						Save Changes
					</Button>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: Platform.OS === 'ios' ? 100 : 70,
	},
	closeBtn: {
		position: 'absolute',
		left: 20,
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	imageContainer: { position: 'relative', marginBottom: 32 },
	avatar: { width: 180, height: 180, borderRadius: 90 },
	overlayContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: 90,
		backgroundColor: 'rgba(0,0,0,0.3)',
		justifyContent: 'center',
		alignItems: 'center',
		opacity: 0,
	},
	overlayText: { color: '#FFF', fontSize: 14, fontWeight: '600', marginTop: 8 },
	editIndicator: {
		position: 'absolute',
		top: 10,
		right: 10,
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: 'center',
		alignItems: 'center',
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
	},
	badgeText: { fontSize: 14, fontWeight: '600' },
	form: { width: '100%', alignItems: 'center', gap: 24 },
	title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
	subtitle: { fontSize: 16, textAlign: 'center' },
	inputRow: { width: '100%', flexDirection: 'row', gap: 12 },
	input: { height: 56, borderRadius: 16, paddingHorizontal: 16, fontSize: 16 },
	errorText: { fontSize: 12, marginTop: 4, marginLeft: 4 },
	diceButton: {
		width: 56,
		height: 56,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	locationSelect: { flexDirection: 'row', gap: 12, marginTop: 0 },
	locationButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		height: 56,
		borderRadius: 16,
		gap: 8,
	},
	locationButtonActive: { backgroundColor: '#E6F2E8' },
	locationText: { fontSize: 16, fontWeight: '500', color: '#555555' },
	buttonContainer: {
		position: 'absolute',
		bottom: Platform.OS === 'ios' ? 20 : 20,
		left: 20,
		right: 20,
	},
});
