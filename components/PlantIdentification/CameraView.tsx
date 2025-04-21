import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { CameraView as ExpoCamera, CameraType } from 'expo-camera';
import { Image as ImageIcon, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

interface Props {
	onCapture: (uri: string) => void;
	onPickImage: () => Promise<void>;
}

export function CameraViewComponent({ onCapture, onPickImage }: Props) {
	const [cameraType, setCameraType] = useState<CameraType>('back');
	const [isCapturing, setIsCapturing] = useState(false);
	const cameraRef = useRef(null);

	const takePicture = async () => {
		if (cameraRef.current && !isCapturing) {
			setIsCapturing(true);
			try {
				const photo = await cameraRef.current.takePictureAsync({
					quality: 0.6,
					base64: false,
				});
				onCapture(photo.uri);
			} catch (error) {
				console.error('Error taking picture:', error);
			} finally {
				setIsCapturing(false);
			}
		}
	};

	const flipCamera = () => {
		setCameraType((current) => (current === 'back' ? 'front' : 'back'));
	};

	return (
		<ExpoCamera ref={cameraRef} style={styles.camera} facing={cameraType}>
			<View style={styles.cameraControls}>
				<TouchableOpacity onPress={flipCamera} style={styles.flipButton}>
					<RotateCcw color="white" />
				</TouchableOpacity>
				<View style={styles.bottomControls}>
					<TouchableOpacity onPress={onPickImage} style={styles.galleryButton}>
						<ImageIcon color="white" size={24} />
					</TouchableOpacity>
					<TouchableOpacity
						onPress={takePicture}
						style={styles.captureButton}
						disabled={isCapturing}
					>
						<View style={styles.captureButtonInner} />
					</TouchableOpacity>
					<View style={styles.placeholderButton} />
				</View>
			</View>
			<LinearGradient
				colors={['transparent', 'rgba(0,0,0,0.7)']}
				style={styles.cameraOverlay}
				pointerEvents="none"
			/>
			<View style={styles.helpTextContainer} pointerEvents="none">
				<Text style={styles.helpText}>Point camera at a plant to identify</Text>
			</View>
		</ExpoCamera>
	);
}

const styles = StyleSheet.create({
	camera: {
		flex: 1,
	},
	cameraControls: {
		flex: 1,
		padding: 20,
		justifyContent: 'space-between',
	},
	flipButton: {
		alignSelf: 'flex-end',
		backgroundColor: 'rgba(0,0,0,0.6)',
		padding: 10,
		borderRadius: 20,
	},
	bottomControls: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	galleryButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	captureButton: {
		width: 70,
		height: 70,
		borderRadius: 35,
		backgroundColor: 'rgba(255,255,255,0.3)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	captureButtonInner: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: 'white',
	},
	placeholderButton: {
		width: 50,
		height: 50,
	},
	cameraOverlay: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: 150,
	},
	helpTextContainer: {
		position: 'absolute',
		top: '15%',
		left: 0,
		right: 0,
		alignItems: 'center',
	},
	helpText: {
		color: 'white',
		fontSize: 16,
		backgroundColor: 'rgba(0,0,0,0.4)',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
	},
});
