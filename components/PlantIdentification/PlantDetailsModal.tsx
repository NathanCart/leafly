import React, { useState, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Modal,
	ScrollView,
	Image,
	useWindowDimensions,
	Platform,
	Animated,
	StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
	X,
	Sun,
	Droplet,
	Leaf,
	ChevronDown,
	MapPin,
	AlertTriangle,
	Apple,
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { COLORS } from '@/app/constants/colors';
import { PlantIdClassificationResponse } from '@/types/plants';

interface Props {
	visible: boolean;
	onClose: () => void;
	plant: PlantIdClassificationResponse[0] | null;
	onConfirm: () => void;
	isDark: boolean;
}

interface ExpandableCardProps {
	title: string;
	content: string;
	icon: React.ReactNode;
	isDark: boolean;
}

function ExpandableCard({ title, content, icon, isDark }: ExpandableCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const animation = useRef(new Animated.Value(0)).current;

	const toggleExpand = () => {
		const toValue = isExpanded ? 0 : 1;
		setIsExpanded(!isExpanded);

		Animated.spring(animation, {
			toValue,
			useNativeDriver: true,
			tension: 40,
			friction: 7,
		}).start();
	};

	const rotateIcon = animation.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '180deg'],
	});

	return (
		<View style={[styles.careItem, { backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' }]}>
			<View
				style={[
					styles.careIconContainer,
					{ backgroundColor: isDark ? '#1A2A20' : '#E6F2E8' },
				]}
			>
				{icon}
			</View>
			<View style={styles.careTextContainer}>
				<Text
					style={[styles.careTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}
					numberOfLines={1}
				>
					{title}
				</Text>
				<Text
					style={[styles.careText, { color: isDark ? '#BBBBBB' : '#555555' }]}
					numberOfLines={isExpanded ? undefined : 3}
				>
					{content}
				</Text>
				{content?.length > 120 && (
					<TouchableOpacity style={styles.expandButton} onPress={toggleExpand}>
						<Text style={[styles.expandButtonText, { color: COLORS.primary }]}>
							{isExpanded ? 'Show Less' : 'Read More'}
						</Text>
						<Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
							<ChevronDown color={COLORS.primary} size={16} />
						</Animated.View>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
}

function getWateringText(min?: number, max?: number): string {
	if (!min || !max) return 'No watering information available';

	const levels = ['Dry', 'Medium', 'Wet'];
	const minText = levels[min - 1] || 'Unknown';
	const maxText = levels[max - 1] || 'Unknown';

	if (min === max) return `${minText} soil conditions`;
	return `${minText} to ${maxText} soil conditions`;
}

function getWateringSymbols(min?: number, max?: number): string {
	if (!min || !max) return '';

	const maxDroplets = Math.max(min, max);
	return '💧'.repeat(maxDroplets);
}

export function PlantDetailsModal({ visible, onClose, plant, onConfirm, isDark }: Props) {
	const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
	const descriptionAnimation = useRef(new Animated.Value(0)).current;
	const { width: windowWidth } = useWindowDimensions();
	const scrollY = useRef(new Animated.Value(0)).current;
	const insets = useSafeAreaInsets();

	const toggleDescription = () => {
		const toValue = isDescriptionExpanded ? 0 : 1;
		setIsDescriptionExpanded(!isDescriptionExpanded);

		Animated.spring(descriptionAnimation, {
			toValue,
			useNativeDriver: true,
			tension: 40,
			friction: 7,
		}).start();
	};

	const rotateIcon = descriptionAnimation.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '180deg'],
	});

	const imageTranslateY = scrollY.interpolate({
		inputRange: [0, 300],
		outputRange: [0, 150],
		extrapolate: 'clamp',
	});

	if (!plant) return null;

	const description = plant.details?.description?.value;
	const shouldTruncate = description?.length > 100;
	const truncatedText =
		shouldTruncate && !isDescriptionExpanded
			? description.substring(0, 100) + '...'
			: description;

	const hasEdibleParts = plant.details?.edible_parts && plant.details.edible_parts.length > 0;
	const hasToxicity = plant.details?.toxicity && plant.details.toxicity.trim().length > 0;
	const showSafetySection = hasEdibleParts || hasToxicity;

	const wateringText = getWateringText(
		plant.details?.watering?.min,
		plant.details?.watering?.max
	);
	const wateringSymbols = getWateringSymbols(
		plant.details?.watering?.min,
		plant.details?.watering?.max
	);

	return (
		<Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
			<View
				style={[
					styles.container,
					{ backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)' },
				]}
			>
				<StatusBar barStyle="light-content" />
				<TouchableOpacity
					style={[styles.closeButton, { top: insets.top }]}
					onPress={onClose}
				>
					<X color="white" size={24} />
				</TouchableOpacity>

				<Animated.ScrollView
					style={styles.scrollView}
					onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
						useNativeDriver: true,
					})}
					scrollEventThrottle={16}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollViewContent}
				>
					<View style={styles.imageContainer}>
						<Animated.Image
							source={{ uri: plant.similar_images?.[0]?.url }}
							style={[
								styles.image,
								{
									width: windowWidth,
									transform: [{ translateY: imageTranslateY }],
								},
							]}
						/>
					</View>

					<View
						style={[
							styles.content,
							{
								backgroundColor: isDark ? '#121212' : '#FFFFFF',
								marginTop: -20,
								borderTopLeftRadius: 20,
								borderTopRightRadius: 20,
							},
						]}
					>
						<View style={styles.locationBadge}>
							<View
								style={[
									styles.locationContainer,
									{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
								]}
							>
								<MapPin size={16} color={COLORS.primary} />
								<Text
									style={[
										styles.locationText,
										{ color: isDark ? '#E0E0E0' : '#283618' },
									]}
									numberOfLines={1}
								>
									{plant?.location} Plant
								</Text>
							</View>
						</View>

						<View style={styles.titleContainer}>
							<View style={styles.titleWrapper}>
								<Text
									style={[styles.title, { color: isDark ? '#FFF' : '#000' }]}
									numberOfLines={2}
								>
									{plant.name}
								</Text>
								<Text
									style={[styles.subtitle, { color: isDark ? '#BBB' : '#666' }]}
									numberOfLines={2}
								>
									{plant?.details?.taxonomy?.family}{' '}
									{plant?.details?.taxonomy?.genus}
								</Text>
								<Text
									style={[{ marginTop: 8 }, { color: isDark ? '#BBB' : '#666' }]}
								>
									{wateringText} {wateringSymbols}
								</Text>
							</View>
							<View
								style={[styles.confidenceTag, { backgroundColor: COLORS.success }]}
							>
								<Text style={styles.confidenceText}>
									{Math.round(plant?.probability * 100)}%
								</Text>
							</View>
						</View>

						<View style={styles.section}>
							<Text
								style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#000' }]}
							>
								About
							</Text>
							<View style={styles.descriptionContainer}>
								<Text
									style={[
										styles.description,
										{ color: isDark ? '#BBB' : '#666' },
									]}
								>
									{truncatedText}
								</Text>
								{shouldTruncate && (
									<TouchableOpacity
										style={styles.readMoreButton}
										onPress={toggleDescription}
									>
										<Text
											style={[styles.readMoreText, { color: COLORS.primary }]}
										>
											{isDescriptionExpanded ? 'Read Less' : 'Read More'}
										</Text>
										<Animated.View
											style={{ transform: [{ rotate: rotateIcon }] }}
										>
											<ChevronDown color={COLORS.primary} size={20} />
										</Animated.View>
									</TouchableOpacity>
								)}
							</View>
						</View>

						<View style={styles.section}>
							<Text
								style={[
									styles.sectionTitle,
									{ color: isDark ? '#E0E0E0' : '#283618' },
								]}
							>
								Care Instructions
							</Text>

							<View style={styles.careInstructions}>
								{!!plant.details?.best_watering && (
									<ExpandableCard
										title="Water"
										content={`${
											plant.details?.best_watering || 'No watering info'
										}`}
										icon={<Droplet color="#33A1FF" size={24} />}
										isDark={isDark}
									/>
								)}

								{!!plant?.details?.best_light_condition && (
									<ExpandableCard
										title="Light"
										content={
											plant?.details?.best_light_condition ?? 'No light info'
										}
										icon={<Sun color="#FFC43D" size={24} />}
										isDark={isDark}
									/>
								)}

								{!!plant?.details?.best_soil_type && (
									<ExpandableCard
										title="Soil"
										content={plant?.details?.best_soil_type ?? 'No soil info'}
										icon={<Leaf color="#4CAF50" size={24} />}
										isDark={isDark}
									/>
								)}
							</View>
						</View>

						{showSafetySection && (
							<View style={styles.section}>
								<Text
									style={[
										styles.sectionTitle,
										{ color: isDark ? '#E0E0E0' : '#283618' },
									]}
								>
									Safety Information
								</Text>

								<View style={styles.safetyContainer}>
									{hasEdibleParts && (
										<ExpandableCard
											title="Edible Parts"
											content={plant?.details?.edible_parts?.join(', ')!}
											icon={<Apple color="#4CAF50" size={24} />}
											isDark={isDark}
										/>
									)}

									{hasToxicity && (
										<ExpandableCard
											title="Toxicity"
											content={plant?.details?.toxicity ?? ''}
											icon={<AlertTriangle color="#FF6B6B" size={24} />}
											isDark={isDark}
										/>
									)}
								</View>
							</View>
						)}

						<View style={styles.bottomSpacing} />
					</View>
				</Animated.ScrollView>

				<View
					style={[
						styles.stickyButtonContainer,
						{
							backgroundColor: isDark ? '#121212' : '#FFFFFF',
							paddingBottom: insets.bottom || 20,
						},
					]}
				>
					<Button onPress={onConfirm} fullWidth size="large">
						Add to My Collection
					</Button>
					<Button
						onPress={onClose}
						variant="secondary"
						fullWidth
						style={{ marginTop: 12 }}
					>
						Back to Results
					</Button>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	careInstructions: {
		gap: 16,
	},
	careItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		padding: 16,
		borderRadius: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	careIconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	careTextContainer: {
		flex: 1,
		minHeight: 80,
	},
	careTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
	},
	careText: {
		fontSize: 14,
		lineHeight: 20,
	},
	expandButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
		paddingVertical: 4,
	},
	expandButtonText: {
		fontSize: 14,
		fontWeight: '600',
		marginRight: 4,
	},
	container: {
		flex: 1,
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
	scrollView: {
		flex: 1,
	},
	scrollViewContent: {
		paddingBottom: 0,
	},
	imageContainer: {
		height: 400,
		overflow: 'hidden',
	},
	image: {
		height: 500,
		resizeMode: 'cover',
	},
	content: {
		flex: 1,
		padding: 24,
		minHeight: '100%',
	},
	locationBadge: {
		alignItems: 'center',
		marginBottom: 20,
	},
	locationContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		gap: 8,
		maxWidth: '80%',
	},
	locationText: {
		fontSize: 14,
		fontWeight: '600',
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 28,
		gap: 16,
	},
	titleWrapper: {
		flex: 1,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		marginBottom: 8,
		lineHeight: 34,
	},
	subtitle: {
		fontSize: 16,
		fontStyle: 'italic',
		lineHeight: 22,
	},
	section: {
		marginBottom: 32,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 16,
		letterSpacing: 0.5,
	},
	descriptionContainer: {
		marginBottom: 8,
	},
	description: {
		fontSize: 16,
		lineHeight: 24,
	},
	readMoreButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 12,
		paddingVertical: 4,
	},
	readMoreText: {
		fontSize: 14,
		fontWeight: '600',
		marginRight: 4,
	},
	confidenceTag: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		minWidth: 60,
		alignItems: 'center',
	},
	confidenceText: {
		color: '#FFF',
		fontWeight: '600',
		fontSize: 14,
	},
	careGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
	},
	careLabel: {
		fontSize: 14,
		textAlign: 'center',
	},
	stickyButtonContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		padding: 16,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: 'rgba(0, 0, 0, 0.1)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 4,
	},
	bottomSpacing: {
		height: 140,
	},
	safetyContainer: {
		gap: 16,
	},
	safetyItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		padding: 16,
		borderRadius: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	safetyIconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	safetyTextContainer: {
		flex: 1,
	},
	safetyTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
	},
	safetyText: {
		fontSize: 14,
		lineHeight: 20,
	},
	ediblePartsList: {
		marginTop: 4,
	},
	ediblePartItem: {
		marginBottom: 6,
	},
	ediblePartText: {
		fontSize: 14,
		lineHeight: 20,
	},
});
