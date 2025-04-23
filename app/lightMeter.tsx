import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Info, Sun } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';

export default function LightMeter() {
	const [permission, requestPermission] = useCameraPermissions();
	const [lightReading, setLightReading] = useState(0);
	const [lightLevel, setLightLevel] = useState('');
	const [description, setDescription] = useState('');
	const [suitablePlants, setSuitablePlants] = useState([]);
	const [measuring, setMeasuring] = useState(false);
	const cameraRef = useRef(null);
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';

	useEffect(() => {
		if (measuring) {
			const timer = setTimeout(() => {
				// Simulate light measurement
				const reading = Math.floor(Math.random() * 100) + 1;
				setLightReading(reading);

				// Determine light level based on reading
				if (reading < 30) {
					setLightLevel('Low Light');
					setDescription(
						'This spot receives minimal natural light, suitable for shade-loving plants.'
					);
					setSuitablePlants(['Snake Plant', 'ZZ Plant', 'Pothos', 'Peace Lily']);
				} else if (reading < 70) {
					setLightLevel('Medium Light');
					setDescription(
						'This area gets good indirect light, perfect for many common houseplants.'
					);
					setSuitablePlants(['Monstera', 'Rubber Plant', 'Philodendron', 'Peperomia']);
				} else {
					setLightLevel('Bright Light');
					setDescription(
						'This spot receives plenty of light, ideal for sun-loving plants.'
					);
					setSuitablePlants([
						'Cacti',
						'Succulents',
						'Fiddle Leaf Fig',
						'Bird of Paradise',
					]);
				}

				setMeasuring(false);
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [measuring]);

	if (!permission) {
		// Camera permissions are still loading
		return (
			<View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
				<Text>Requesting permissions...</Text>
			</View>
		);
	}

	if (!permission.granted) {
		// Camera permissions are not granted yet
		return (
			<View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
				<Text style={[styles.permissionText, { color: isDark ? '#E0E0E0' : '#283618' }]}>
					We need your permission to use the camera for the light meter
				</Text>
				<TouchableOpacity
					style={[styles.permissionButton, { backgroundColor: '#3A8349' }]}
					onPress={requestPermission}
				>
					<Text style={styles.permissionButtonText}>Grant Permission</Text>
				</TouchableOpacity>
			</View>
		);
	}

	const startMeasuring = () => {
		setMeasuring(true);
	};

	return (
		<View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
			{/* Camera for light measurement */}
			<CameraView ref={cameraRef} style={styles.camera} facing="back">
				{/* Overlay with UI */}
				<LinearGradient
					colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
					style={styles.gradient}
				>
					<View style={styles.header}>
						<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
							<ChevronLeft color="white" size={24} />
						</TouchableOpacity>
						<Text style={styles.headerTitle}>Light Meter</Text>
						<TouchableOpacity style={styles.infoButton}>
							<Info color="white" size={20} />
						</TouchableOpacity>
					</View>

					<View style={styles.meterContainer}>
						<View style={[styles.meterOuter, measuring && styles.measuringOuter]}>
							<View
								style={[
									styles.meterInner,
									{ backgroundColor: getColorForReading(lightReading) },
								]}
							>
								<Sun color="white" size={measuring ? 36 : 28} />
							</View>
						</View>

						{!measuring && lightReading > 0 ? (
							<>
								<Text style={styles.readingText}>{lightReading}%</Text>
								<Text style={styles.levelText}>{lightLevel}</Text>
							</>
						) : (
							<Text style={styles.measurePrompt}>
								{measuring ? 'Measuring...' : 'Tap to measure light'}
							</Text>
						)}
					</View>

					{!measuring && lightReading > 0 ? (
						<View style={styles.resultsContainer}>
							<Text style={styles.descriptionText}>{description}</Text>

							<View style={styles.plantsContainer}>
								<Text style={styles.suitableText}>Suitable Plants:</Text>
								<View style={styles.plantsList}>
									{suitablePlants.map((plant, index) => (
										<View
											key={index}
											style={[
												styles.plantChip,
												{ backgroundColor: 'rgba(58, 131, 73, 0.7)' },
											]}
										>
											<Text style={styles.plantChipText}>{plant}</Text>
										</View>
									))}
								</View>
							</View>

							<TouchableOpacity
								style={[
									styles.measureAgainButton,
									{ backgroundColor: 'rgba(255,255,255,0.2)' },
								]}
								onPress={startMeasuring}
							>
								<Text style={styles.measureAgainText}>Measure Again</Text>
							</TouchableOpacity>
						</View>
					) : (
						<TouchableOpacity
							style={[styles.measureButton, measuring && { opacity: 0.5 }]}
							onPress={startMeasuring}
							disabled={measuring}
						>
							<Text style={styles.measureButtonText}>
								{measuring ? 'Measuring...' : 'Measure Light'}
							</Text>
						</TouchableOpacity>
					)}
				</LinearGradient>
			</CameraView>
		</View>
	);
}

// Helper function to determine color based on light reading
function getColorForReading(reading) {
	if (reading < 30) {
		return '#55668D'; // Darker blue for low light
	} else if (reading < 70) {
		return '#FFC43D'; // Yellow for medium light
	} else {
		return '#FF9F1C'; // Bright orange for bright light
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	camera: {
		flex: 1,
	},
	gradient: {
		flex: 1,
		padding: 20,
		justifyContent: 'space-between',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: Platform.OS === 'ios' ? 40 : 20,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.3)',
	},
	headerTitle: {
		color: 'white',
		fontSize: 18,
		fontWeight: '600',
	},
	infoButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.3)',
	},
	meterContainer: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	meterOuter: {
		width: 150,
		height: 150,
		borderRadius: 75,
		backgroundColor: 'rgba(255,255,255,0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
	},
	measuringOuter: {
		width: 180,
		height: 180,
		borderRadius: 90,
	},
	meterInner: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: '#FFC43D',
		justifyContent: 'center',
		alignItems: 'center',
	},
	readingText: {
		color: 'white',
		fontSize: 36,
		fontWeight: '700',
	},
	levelText: {
		color: 'white',
		fontSize: 20,
		fontWeight: '600',
		marginTop: 8,
	},
	measurePrompt: {
		color: 'white',
		fontSize: 18,
		fontWeight: '500',
		marginTop: 20,
	},
	resultsContainer: {
		padding: 20,
		backgroundColor: 'rgba(0,0,0,0.6)',
		borderRadius: 16,
		marginBottom: 20,
	},
	descriptionText: {
		color: 'white',
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 16,
	},
	plantsContainer: {
		marginBottom: 20,
	},
	suitableText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 10,
	},
	plantsList: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	plantChip: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
	},
	plantChipText: {
		color: 'white',
		fontSize: 14,
		fontWeight: '500',
	},
	measureAgainButton: {
		paddingVertical: 12,
		borderRadius: 20,
		alignItems: 'center',
	},
	measureAgainText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
	measureButton: {
		backgroundColor: '#3A8349',
		paddingVertical: 16,
		borderRadius: 30,
		alignItems: 'center',
		marginBottom: Platform.OS === 'ios' ? 40 : 20,
	},
	measureButtonText: {
		color: 'white',
		fontSize: 18,
		fontWeight: '600',
	},
	permissionText: {
		textAlign: 'center',
		marginBottom: 20,
		fontSize: 16,
		paddingHorizontal: 40,
	},
	permissionButton: {
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 8,
	},
	permissionButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
});
