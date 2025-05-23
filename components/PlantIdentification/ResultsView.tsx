import React from 'react';
import {
	View,
	StyleSheet,
	TouchableOpacity,
	Image,
	Animated,
	Platform,
	StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { PlantIdClassificationResponse } from '@/types/plants';
import { COLORS } from '@/app/constants/colors';
import { Text } from '@/components/Text';

interface Props {
	results: PlantIdClassificationResponse;
	onReset: () => void;
	onSelectPlant: (plant: PlantIdClassificationResponse[0]) => void;
	scrollY: Animated.Value;
	imageUri: string;
}

export function ResultsView({ results, onReset, onSelectPlant, scrollY, imageUri }: Props) {
	const insets = useSafeAreaInsets();

	const imageTranslateY = scrollY.interpolate({
		inputRange: [0, 200],
		outputRange: [0, 100],
		extrapolate: 'clamp',
	});

	// Add captured image to each result
	const resultsWithImage = results.map((result) => ({
		...result,
		capturedImageUri: imageUri,
	}));

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" />
			<TouchableOpacity
				onPress={onReset}
				style={[styles.closeButton, { top: Platform.OS === 'ios' ? insets.top + 10 : 20 }]}
			>
				<X color="white" />
			</TouchableOpacity>
			<Animated.ScrollView
				style={styles.scrollView}
				onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
					useNativeDriver: true,
				})}
				scrollEventThrottle={16}
			>
				<View style={styles.parallaxContainer}>
					<View style={styles.parallaxBackground} />
					<Animated.Image
						source={{ uri: imageUri }}
						style={[styles.topImage, { transform: [{ translateY: imageTranslateY }] }]}
						resizeMode="cover"
					/>
				</View>

				<View style={styles.resultsContent}>
					<Text style={[styles.selectionTitle, COLORS.titleMd]}>
						Choose Your Plant Match
					</Text>
					<View style={{ marginVertical: 10 }}>
						<Button onPress={onReset} variant="secondary">
							Try Another Photo
						</Button>
					</View>
					{resultsWithImage.map((result, index) => (
						<TouchableOpacity
							key={index}
							style={styles.resultCard}
							onPress={() => onSelectPlant(result)}
						>
							<Image
								source={{ uri: result?.similar_images[0]?.url }}
								style={styles.resultImage}
							/>
							<View style={styles.resultContent}>
								<Text style={styles.resultName}>{result.name}</Text>
								<Text style={styles.resultScientific}>
									{result.details?.taxonomy?.family}
								</Text>
								<Text style={styles.resultDescription}>
									{result.details?.description?.value?.slice(0, 150)}...
								</Text>
								<View style={styles.confidenceBadge}>
									<Text style={styles.confidenceText}>
										{Math.round(result?.probability * 100)}% Match
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					))}
				</View>
			</Animated.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
	},
	scrollView: {
		flex: 1,
	},
	closeButton: {
		position: 'absolute',
		left: 20,
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	parallaxContainer: {
		height: 400,
		position: 'relative',
		backgroundColor: '#000',
		overflow: 'hidden',
	},
	parallaxBackground: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: '#000',
	},
	topImage: {
		width: '100%',
		height: 420,
		position: 'absolute',
	},
	resultsContent: {
		padding: 20,
		backgroundColor: '#fff',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		marginTop: -20,
	},
	selectionTitle: {
		marginBottom: 12,
	},
	resultCard: {
		borderRadius: 20,
		marginBottom: 20,
		overflow: 'hidden',
		borderWidth: 2,
		borderColor: COLORS.border,
	},
	resultImage: {
		width: '100%',
		height: 200,
	},
	resultContent: {
		padding: 16,
	},
	resultName: {
		fontSize: 18,
		fontWeight: '700',
		color: '#283618',
	},
	resultScientific: {
		fontSize: 14,
		fontStyle: 'italic',
		marginBottom: 8,
		color: '#555555',
	},
	resultDescription: {
		fontSize: 14,
		marginBottom: 8,
		color: '#555555',
		lineHeight: 20,
	},
	confidenceBadge: {
		backgroundColor: '#3A8349',
		borderRadius: 8,
		padding: 6,
		alignSelf: 'flex-start',
	},
	confidenceText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '500',
	},
});
