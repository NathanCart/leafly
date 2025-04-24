import React, { useState, useRef, useEffect } from 'react';
import {
	Modal,
	View,
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
import { X, Plus, Share2, Camera, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';
import { usePlantImages } from '@/hooks/usePlantImages';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/app/constants/colors';
import { Text } from '@/components/Text';
import { useS3Uploader } from '../useS3Uploader';

interface GalleryModalProps {
	visible: boolean;
	onClose: () => void;
	plantId: string;
	mainImage: string;
	isDark: boolean;
}

export function GalleryModal({ visible, onClose, plantId, mainImage, isDark }: GalleryModalProps) {
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();
	const imageSize = (width - 44) / 2;

	const [actionLoading, setActionLoading] = useState(false);
	const [viewerVisible, setViewerVisible] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const scrollRef = useRef<ScrollView>(null);

	const BUCKET = process.env.EXPO_PUBLIC_BUCKET_NAME!;
	const { uploadFile, isUploading: isUploadingToS3, error: uploadError } = useS3Uploader(BUCKET);
	const { images, loading, addImage, deleteImage, refresh } = usePlantImages(plantId);

	const allImages = [{ id: 'main', image_url: mainImage }, ...(images || [])];

	const pickAndUpload = async (picker: () => Promise<ImagePicker.ImagePickerResult>) => {
		try {
			setActionLoading(true);
			const result = await picker();
			if (result.canceled || !result.assets.length) return;
			const uri = result.assets[0].uri;
			const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
			const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

			// Upload to S3
			const { url } = await uploadFile(uri, contentType);
			// Save to DB

			await addImage(url);
			await refresh();
		} catch (err: any) {
			Alert.alert('Error', err.message || 'Failed to add image');
		} finally {
			setActionLoading(false);
		}
	};

	const handleImagePick = () => {
		pickAndUpload(() =>
			ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.6,
			})
		);
	};

	const handleCameraCapture = () => {
		pickAndUpload(() => ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true }));
	};

	const handleShare = async (imageUrl: string) => {
		try {
			await Share.share({ url: imageUrl, message: 'Check out my plant progress!' });
		} catch (error) {
			console.error('Share error:', error);
		}
	};

	const handleDelete = (imageId: string) => {
		Alert.alert('Delete Image', 'Are you sure you want to delete this image?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					try {
						setActionLoading(true);
						await deleteImage(imageId);
						await refresh();
					} catch {
						Alert.alert('Error', 'Failed to delete image');
					} finally {
						setActionLoading(false);
					}
				},
			},
		]);
	};

	const openViewer = (index: number) => {
		setSelectedIndex(index);
		setViewerVisible(true);
	};

	const closeViewer = () => {
		setViewerVisible(false);
	};

	useEffect(() => {
		if (viewerVisible && scrollRef.current) {
			scrollRef.current.scrollTo({ x: selectedIndex * width, animated: false });
		}
	}, [viewerVisible, selectedIndex, width]);

	return (
		<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
			<View
				style={[
					styles.container,
					{ backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)' },
				]}
			>
				<View style={[styles.content, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
					<TouchableOpacity
						style={[styles.backBtn, { top: insets.top + 8 }]}
						onPress={onClose}
					>
						<X color="#fff" size={24} />
					</TouchableOpacity>

					{loading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={COLORS.primary} />
						</View>
					) : (
						<ScrollView style={[styles.gallery, { paddingTop: insets.top + 8 }]}>
							<View style={styles.grid}>
								{allImages.map((image, idx) => (
									<TouchableOpacity
										key={image.id}
										onPress={() => openViewer(idx)}
										style={{
											width: imageSize,
											height: imageSize,
											borderRadius: 2,
											overflow: 'hidden',
											backgroundColor: isDark ? '#121212' : '#FFFFFF',
											margin: 2,
										}}
									>
										<Image
											source={{ uri: image.image_url }}
											style={styles.image}
										/>
									</TouchableOpacity>
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
						loading={actionLoading || isUploadingToS3}
						disabled={actionLoading || isUploadingToS3}
					>
						Take Progress Photo
					</Button>
					<Button
						onPress={handleImagePick}
						variant="secondary"
						icon={<Plus color={COLORS.primary} size={20} />}
						fullWidth
						loading={actionLoading || isUploadingToS3}
						disabled={actionLoading || isUploadingToS3}
					>
						Add from Gallery
					</Button>
				</View>

				<Modal visible={viewerVisible} animationType="fade" transparent>
					<View style={styles.viewerContainer}>
						<TouchableOpacity
							style={[styles.backBtn, { top: insets.top + 8, right: 16 }]}
							onPress={closeViewer}
						>
							<X color="#fff" size={24} />
						</TouchableOpacity>

						<ScrollView
							ref={scrollRef}
							horizontal
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							style={{ flex: 1 }}
						>
							{allImages.map((image) => (
								<View
									key={image.id}
									style={{
										width,
										height,
										justifyContent: 'center',
										alignItems: 'center',
									}}
								>
									<Image
										source={{ uri: image.image_url }}
										style={{
											width,
											height: height * 0.8,
											resizeMode: 'contain',
										}}
									/>
									<View style={styles.viewerActions}>
										<TouchableOpacity
											onPress={() => handleShare(image.image_url)}
											style={styles.actionBtn}
										>
											<Share2 color="white" size={24} />
										</TouchableOpacity>
										{image.id !== 'main' && (
											<TouchableOpacity
												onPress={() => handleDelete(image.id)}
												style={styles.actionBtn}
											>
												<Trash2 color="white" size={24} />
											</TouchableOpacity>
										)}
									</View>
								</View>
							))}
						</ScrollView>
					</View>
				</Modal>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	content: {
		flex: 1,
		paddingHorizontal: 16,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingBottom: 8,
		maxHeight: '90%',
	},
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
	loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
	gallery: {},
	grid: { flexDirection: 'row', flexWrap: 'wrap' },
	image: { width: '100%', height: '100%', resizeMode: 'cover' },
	buttonContainer: { paddingHorizontal: 16, paddingBottom: 16, marginTop: 'auto' },
	viewerContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },
	viewerActions: {
		position: 'absolute',
		bottom: 32,
		left: 0,
		right: 0,
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 24,
	},
	actionBtn: { padding: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 24 },
});
