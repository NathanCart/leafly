import React from 'react';
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
} from 'react-native';
import { X, Plus, Share2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';

interface GalleryModalProps {
	visible: boolean;
	onClose: () => void;
	onUpload: (uri: string) => Promise<void>;
	images: string[];
	isDark: boolean;
}

export function GalleryModal({ visible, onClose, onUpload, images, isDark }: GalleryModalProps) {
	const { width } = useWindowDimensions();
	const imageSize = (width - 48) / 2;

	const handleImagePick = async () => {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 1,
			});

			if (!result.canceled && result.assets[0]) {
				await onUpload(result.assets[0].uri);
			}
		} catch (error) {
			console.error('Error picking image:', error);
		}
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

	return (
		<Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
			<View
				style={[
					styles.container,
					{ backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)' },
				]}
			>
				<View style={[styles.content, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
					<TouchableOpacity style={styles.closeButton} onPress={onClose}>
						<X color={isDark ? '#E0E0E0' : '#283618'} size={24} />
					</TouchableOpacity>

					<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
						Plant Gallery
					</Text>

					<ScrollView style={styles.gallery}>
						<View style={styles.grid}>
							{images.map((image, index) => (
								<View
									key={index}
									style={[
										styles.imageContainer,
										{ width: imageSize, height: imageSize },
									]}
								>
									<Image source={{ uri: image }} style={styles.image} />
									<TouchableOpacity
										style={styles.shareButton}
										onPress={() => handleShare(image)}
									>
										<Share2 color="white" size={20} />
									</TouchableOpacity>
								</View>
							))}
							<TouchableOpacity
								style={[
									styles.addButton,
									{
										width: imageSize,
										height: imageSize,
										backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
									},
								]}
								onPress={handleImagePick}
							>
								<Plus color={isDark ? '#E0E0E0' : '#283618'} size={32} />
								<Text
									style={[
										styles.addButtonText,
										{ color: isDark ? '#E0E0E0' : '#283618' },
									]}
								>
									Add Photo
								</Text>
							</TouchableOpacity>
						</View>
					</ScrollView>

					<Button
						onPress={onClose}
						variant="secondary"
						fullWidth
						style={{ marginTop: 20 }}
					>
						Close
					</Button>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	content: {
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
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
	gallery: {
		flex: 1,
	},
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
	shareButton: {
		position: 'absolute',
		top: 8,
		right: 8,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	addButton: {
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
	addButtonText: {
		marginTop: 8,
		fontSize: 14,
		fontWeight: '500',
	},
});
