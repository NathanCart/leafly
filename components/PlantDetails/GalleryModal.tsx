import React, { useState } from 'react';
import {
	Modal,
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Image,
	useWindowDimensions,
	Platform,
	ActivityIndicator,
	Alert,
	Share,
} from 'react-native';
import { X, Plus, Share2, Camera, Trash2, ChevronLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';
import { usePlantImages } from '@/hooks/usePlantImages';
import { COLORS } from '@/app/constants/colors';
import { router } from 'expo-router';
import { usePlants } from '@/hooks/usePlants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GalleryModalProps {
	visible: boolean;
	onClose: () => void;
	plantId: string;
	mainImage: string;
	isDark: boolean;
}

export function GalleryModal({ visible, onClose, plantId, mainImage, isDark }: GalleryModalProps) {
	const insets = useSafeAreaInsets();
	const { width } = useWindowDimensions();
	const imageSize = (width - 48) / 2;
	const [uploading, setUploading] = useState(false);
	const { images, loading, addImage, deleteImage } = usePlantImages(plantId);
	const { uploadImage } = usePlants();

	const handleImagePick = async () => {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.6,
			});

			const uploadedImage = await uploadImage(result?.assets?.[0].uri ?? '');

			console.log('Uploaded image:', uploadedImage);

			if (!result.canceled && result.assets[0]) {
				await addImage(uploadedImage);
			}
		} catch (error) {
			console.error('Error picking image:', error);
		} finally {
			setUploading(false);
		}
	};

	const handleCameraCapture = () => {
		router.push({
			pathname: '/identify',
			params: { mode: 'progress', plantId },
		});
	};

	const handleShare = async (imageUrl: string) => {
		try {
			await Share.share({
				url: imageUrl,
				message: 'Check out my plant!',
			});
		} catch (error) {
			console.error('Error sharing image:', error);
		}
	};

	const handleDelete = async (imageId: string) => {
		Alert.alert('Delete Image', 'Are you sure you want to delete this image?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					try {
						await deleteImage(imageId);
					} catch (error) {
						Alert.alert('Error', 'Failed to delete image');
					}
				},
			},
		]);
	};

	const allImages = [{ id: 'main', image_url: mainImage }, ...(images || [])];

	return (
		<Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
			<View
				style={[
					styles.container,

					{
						backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
					},
				]}
			>
				<View
					style={[
						styles.content,
						{
							backgroundColor: isDark ? '#121212' : '#FFFFFF',
						},
					]}
				>
					<TouchableOpacity
						style={[styles.backBtn, { top: insets.top + 8 }]}
						onPress={() => onClose()}
					>
						<X color={COLORS.background.light} size={24} />
					</TouchableOpacity>

					{loading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={COLORS.primary} />
						</View>
					) : (
						<ScrollView style={[styles.gallery, { paddingTop: insets.top + 8 }]}>
							<View style={styles.grid}>
								{allImages.map((image, index) => (
									<View
										key={image.id}
										style={[
											styles.imageContainer,
											{
												width: imageSize,
												height: imageSize,
												borderColor:
													index === 0 ? COLORS.primary : 'transparent',
												borderWidth: index === 0 ? 2 : 0,
												backgroundColor: isDark ? '#121212' : '#FFFFFF',
											},
										]}
									>
										<Image
											source={{ uri: image.image_url }}
											style={styles.image}
										/>
										<View style={styles.imageOverlay}>
											<TouchableOpacity
												style={styles.shareButton}
												onPress={() => handleShare(image.image_url)}
											>
												<Share2 color="white" size={20} />
											</TouchableOpacity>
											{image.id !== 'main' && (
												<TouchableOpacity
													style={[styles.deleteButton]}
													onPress={() => handleDelete(image.id)}
												>
													<Trash2 color="white" size={20} />
												</TouchableOpacity>
											)}
										</View>
									</View>
								))}
							</View>
						</ScrollView>
					)}
				</View>
				<View style={styles.buttonContainer}>
					<Button
						onPress={handleCameraCapture}
						variant="primary"
						icon={<Camera color="white" size={20} />}
						fullWidth
						style={{ marginBottom: 12 }}
					>
						Take Progress Photo
					</Button>
					<Button
						onPress={handleImagePick}
						variant="secondary"
						icon={<Plus color={COLORS.primary} size={20} />}
						fullWidth
						loading={uploading}
						disabled={uploading}
					>
						Add from Gallery
					</Button>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backBtn: {
		position: 'absolute',
		left: 16,
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 16,
		flex: 1,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingBottom: Platform.OS === 'ios' ? 40 : 20,
		maxHeight: '90%',
	},
	closeButton: {
		position: 'absolute',
		top: 20,
		right: 20,
		zIndex: 1,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 24,
		marginTop: 12,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		minHeight: 200,
	},
	gallery: {},
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	imageContainer: {
		borderRadius: 12,
		overflow: 'hidden',
		position: 'relative',
	},
	image: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	imageOverlay: {
		position: 'absolute',
		top: 8,
		right: 8,
		flexDirection: 'row',
		gap: 8,
	},
	shareButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	deleteButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: 'rgba(255,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonContainer: {
		paddingHorizontal: 16,
		paddingBottom: 16,
		marginTop: 'auto',
	},
});
