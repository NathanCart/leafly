import React, { useState, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Platform,
	useColorScheme,
	Animated,
	Image,
	TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { usePlantIdentification } from '@/hooks/usePlantIdentification';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';
import { Camera as CameraIcon, X } from 'lucide-react-native';
import { CameraViewComponent } from '@/components/PlantIdentification/CameraView';
import { ResultsView } from '@/components/PlantIdentification/ResultsView';
import { PlantDetailsModal } from '@/components/PlantIdentification/PlantDetailsModal';
import { AddPlantModal } from '@/components/PlantIdentification/AddPlantModal';
import { usePlants } from '@/hooks/usePlants';
import { PlantIdClassificationResponse } from '@/types/plants';

export default function IdentifyScreen() {
	const [permission, requestPermission] = useCameraPermissions();
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [showResults, setShowResults] = useState(false);
	const [selectedPlant, setSelectedPlant] = useState<PlantIdClassificationResponse[0] | null>(
		null
	);
	const [showPlantDetails, setShowPlantDetails] = useState(false);
	const [showAddPlantModal, setShowAddPlantModal] = useState(false);
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';
	const scrollY = useRef(new Animated.Value(0)).current;

	const { identifying, error, results, identifyPlant } = usePlantIdentification();

	const { addPlant } = usePlants();

	const pickImage = async () => {
		try {
			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (!permissionResult.granted) {
				console.error('Permission to access media library was denied');
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 1,
			});

			console.log('Image picker result:', result);

			if (!result.canceled && result.assets && result.assets[0]) {
				console.log('Selected image URI:', result.assets[0].uri);
				setCapturedImage(result.assets[0].uri);
			}
		} catch (error) {
			console.error('Error picking image:', error);
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
		plant: PlantIdClassificationResponse & {
			capturedImageUri?: string;
		}
	) => {
		setSelectedPlant({
			...plant,
			capturedImageUri: capturedImage,
		});
		setShowPlantDetails(true);
	};

	const handleAddToCollection = () => {
		setShowPlantDetails(false);
		setShowAddPlantModal(true);
	};

	const confirmPlantSelection = async (nickname: string) => {
		if (!selectedPlant) return;

		try {
			await addPlant({
				nickname: nickname || selectedPlant.name,
				...selectedPlant,
			});

			resetIdentification();
			router.push('/(tabs)/collection');
		} catch (error) {
			console.error('Error saving plant:', error);
		}
	};

	const startIdentification = async () => {
		if (!capturedImage) return;
		try {
			const identifiedResults = await identifyPlant(capturedImage);
			const resultsWithCapturedImage = identifiedResults.map((result) => ({
				...result,
				capturedImageUri: capturedImage,
			}));
			setShowResults(true);
		} catch (error) {
			console.error('Identification error:', error);
		}
	};

	const handleClose = () => {
		router.back();
	};

	if (!permission) {
		return (
			<View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
				<TouchableOpacity style={styles.closeButton} onPress={handleClose}>
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

	if (!permission.granted) {
		return (
			<View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
				<TouchableOpacity style={styles.closeButton} onPress={handleClose}>
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
					plant={selectedPlant}
					onConfirm={handleAddToCollection}
					isDark={isDark}
				/>
				{selectedPlant && (
					<AddPlantModal
						visible={showAddPlantModal}
						onClose={() => setShowAddPlantModal(false)}
						plant={selectedPlant}
						onConfirm={confirmPlantSelection}
						isDark={isDark}
					/>
				)}
			</View>
		);
	}

	if (capturedImage) {
		return (
			<View style={styles.container}>
				<TouchableOpacity style={styles.closeButton} onPress={handleClose}>
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
							<X color="white" />
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

	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.closeButton} onPress={handleClose}>
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
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
