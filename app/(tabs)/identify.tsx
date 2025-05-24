// screens/IdentifyScreen.tsx

import { Button } from '@/components/Button';
import { AddPlantStepperModal } from '@/components/PlantIdentification/AddPlantModal';
import { CameraViewComponent } from '@/components/PlantIdentification/CameraView';
import { PlantDetailsModal } from '@/components/PlantIdentification/PlantDetailsModal';
import { ResultsView } from '@/components/PlantIdentification/ResultsView';
import { Text } from '@/components/Text';
import { usePlants } from '@/contexts/DatabaseContext';
import { usePlantIdentification } from '@/hooks/usePlantIdentification';
import { useRevenuecat } from '@/hooks/useRevenuecat';
import { PlantIdClassificationResponse } from '@/types/plants';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera as CameraIcon, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
	Animated,
	Image,
	Platform,
	StyleSheet,
	TouchableOpacity,
	useColorScheme,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function IdentifyScreen() {
	const [permission, requestPermission] = useCameraPermissions();
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [showResults, setShowResults] = useState(false);
	const [selectedPlant, setSelectedPlant] = useState<
		(PlantIdClassificationResponse[0] & { capturedImageUri?: string }) | null
	>(null);

	const { isSubscribed, presentPaywallIfNeeded } = useRevenuecat();
	const [showPlantDetails, setShowPlantDetails] = useState(false);
	const [showAddPlantModal, setShowAddPlantModal] = useState(false);
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';
	const scrollY = useRef(new Animated.Value(0)).current;
	const insets = useSafeAreaInsets();

	const { identifying, error, results, identifyPlant } = usePlantIdentification();
	const { addPlant } = usePlants();

	const pickImage = async () => {
		try {
			const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (!perm.granted) {
				console.error('Gallery permission denied');
				return;
			}
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.6,
			});
			if (!result.canceled && result.assets[0].uri) {
				setCapturedImage(result.assets[0].uri);
			}
		} catch (err) {
			console.error('Error picking image:', err);
		}
	};

	const resetIdentification = () => {
		setCapturedImage(null);
		setShowResults(false);
		setSelectedPlant(null);
		setShowPlantDetails(false);
		setShowAddPlantModal(false);
	};

	const handlePlantSelect = (
		plant: PlantIdClassificationResponse[0] & { capturedImageUri?: string }
	) => {
		setSelectedPlant({ ...plant, capturedImageUri: capturedImage! });
		setShowPlantDetails(true);
	};

	const handleAddToCollection = () => {
		setShowPlantDetails(false);
		setShowAddPlantModal(true);
	};

	const confirmPlantSelection = async (
		customImage: boolean,
		nickname: string,
		imageUri: string | undefined,
		lastWatered: Date,
		location: 'indoor' | 'outdoor',
		soilType: string,
		potDiameter: string,
		lightAmount: string
	) => {
		if (!selectedPlant) return;

		try {
			await addPlant({
				...selectedPlant,
				nickname: nickname || selectedPlant?.name,
				capturedImageUri: !!imageUri
					? imageUri
					: selectedPlant?.details?.image?.value ?? '',
				soil_type: soilType,
				pot_diameter: potDiameter,
				light_amount: lightAmount,
				last_watered: lastWatered.toISOString(),
				lastWatered: lastWatered,
				location: location,
			});
			// do NOT navigate here
		} catch (err) {
			console.error('Error saving plant:', err);
		}
	};

	const startIdentification = async () => {
		(async () => {
			const isSubscribed = await useRevenuecat().isSubscribed();
			if (!isSubscribed) {
				await presentPaywallIfNeeded();
			} else {
				if (!capturedImage) return;
				try {
					await identifyPlant(capturedImage);
					setShowResults(true);
				} catch (err) {
					console.error('Identification error:', err);
				}
			}
		})();
	};

	const handleClose = () => {
		router.back();
	};

	// 1) Permission loading
	if (!permission) {
		return (
			<View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
				<TouchableOpacity
					style={[styles.closeButton, { top: insets.top }]}
					onPress={handleClose}
				>
					<X color={isDark ? '#E0E0E0' : '#283618'} size={24} />
				</TouchableOpacity>
				<View style={styles.permissionContainer}>
					<View
						style={[
							styles.iconContainer,
							{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
						]}
					>
						<CameraIcon color="#3A8349" size={32} />
					</View>
					<Text
						style={[styles.permissionTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}
					>
						Camera Access Required
					</Text>
					<Text
						style={[styles.permissionText, { color: isDark ? '#BBBBBB' : '#555555' }]}
					>
						We need camera access to help you identify plants. Your camera will only be
						used when you're actively taking a photo.
					</Text>
					<Button
						onPress={requestPermission}
						icon={<CameraIcon color="white" size={20} />}
						style={{ marginTop: 24 }}
						fullWidth
					>
						Enable Camera Access
					</Button>
					<Button
						onPress={pickImage}
						variant="secondary"
						style={{ marginTop: 12 }}
						fullWidth
					>
						Choose from Gallery
					</Button>
				</View>
			</View>
		);
	}

	// 2) Permission denied
	if (!permission.granted) {
		return (
			<View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
				<TouchableOpacity
					style={[styles.closeButton, { top: insets.top }]}
					onPress={handleClose}
				>
					<X color={isDark ? '#E0E0E0' : '#283618'} size={24} />
				</TouchableOpacity>
				<View style={styles.permissionContainer}>
					<View
						style={[
							styles.iconContainer,
							{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
						]}
					>
						<CameraIcon color="#3A8349" size={32} />
					</View>
					<Text
						style={[styles.permissionTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}
					>
						Camera Access Required
					</Text>
					<Text
						style={[styles.permissionText, { color: isDark ? '#BBBBBB' : '#555555' }]}
					>
						We need camera access to help you identify plants. Your camera will only be
						used when you're actively taking a photo.
					</Text>
					<Button
						onPress={requestPermission}
						icon={<CameraIcon color="white" size={20} />}
						style={{ marginTop: 24 }}
						fullWidth
					>
						Enable Camera Access
					</Button>
					<Button
						onPress={pickImage}
						variant="secondary"
						style={{ marginTop: 12 }}
						fullWidth
					>
						Choose from Gallery
					</Button>
				</View>
			</View>
		);
	}

	// 3) Results screen
	if (showResults) {
		return (
			<View style={styles.container}>
				<ResultsView
					results={results}
					onReset={resetIdentification}
					onSelectPlant={handlePlantSelect}
					scrollY={scrollY}
					imageUri={capturedImage!}
				/>
				<PlantDetailsModal
					visible={showPlantDetails}
					onClose={() => setShowPlantDetails(false)}
					plant={selectedPlant!}
					onConfirm={handleAddToCollection}
					isDark={isDark}
				/>
				{selectedPlant && (
					<AddPlantStepperModal
						visible={showAddPlantModal}
						onClose={() => {
							setShowAddPlantModal(false);
						}}
						plant={selectedPlant}
						onConfirm={confirmPlantSelection}
						isDark={isDark}
					/>
				)}
			</View>
		);
	}

	// 4) Preview captured image
	if (capturedImage) {
		return (
			<View style={styles.container}>
				<TouchableOpacity
					style={[styles.closeButton, { top: insets.top }]}
					onPress={handleClose}
				>
					<X color="white" size={24} />
				</TouchableOpacity>
				<Image source={{ uri: capturedImage }} style={styles.previewImage} />
				<View style={styles.previewOverlay}>
					{error && <Text style={styles.errorText}>{error}</Text>}
					<View style={styles.previewControls}>
						<TouchableOpacity
							onPress={resetIdentification}
							style={styles.previewButton}
						>
							<X color="white" size={24} />
						</TouchableOpacity>
						<Button
							onPress={startIdentification}
							loading={identifying}
							style={{ flex: 1, marginLeft: 12 }}
						>
							Identify Plant
						</Button>
					</View>
				</View>
			</View>
		);
	}

	// 5) Default: camera view
	return (
		<View style={styles.container}>
			<TouchableOpacity
				style={[styles.closeButton, { top: insets.top }]}
				onPress={handleClose}
			>
				<X color="white" size={24} />
			</TouchableOpacity>
			<CameraViewComponent onCapture={setCapturedImage} onPickImage={pickImage} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	closeButton: {
		position: 'absolute',
		top: Platform.OS === 'ios' ? 24 : 20,
		left: 20,
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(0,0,0,0.3)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	permissionContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
		maxWidth: 480,
		width: '100%',
		alignSelf: 'center',
	},
	iconContainer: {
		width: 80,
		height: 80,
		borderRadius: 40,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
	},
	permissionTitle: {
		fontSize: 24,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 12,
	},
	permissionText: {
		fontSize: 16,
		textAlign: 'center',
		lineHeight: 24,
	},
	previewImage: {
		...StyleSheet.absoluteFillObject,
	},
	previewOverlay: {
		flex: 1,
		justifyContent: 'flex-end',
		padding: 20,
	},
	previewControls: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	previewButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: 'rgba(0,0,0,0.6)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	errorText: {
		color: 'red',
		marginBottom: 10,
	},
});
