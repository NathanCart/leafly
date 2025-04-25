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
import { Heart, HeartCrack, X } from 'lucide-react-native';
import { COLORS } from '@/app/constants/colors';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { PlantHealthReport } from '@/types/plants';

interface Props {
	report: PlantHealthReport;
	onReset: () => void;
	scrollY: Animated.Value;
	imageUri: string;
}

export function PlantHealthResultsView({ report, onReset, scrollY, imageUri }: Props) {
	const insets = useSafeAreaInsets();

	const imageTranslateY = scrollY.interpolate({
		inputRange: [0, 200],
		outputRange: [0, 100],
		extrapolate: 'clamp',
	});

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
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							display: 'flex',
							gap: 8,
						}}
					>
						<Text style={[COLORS.titleMd]}>Health Report</Text>

						<Text style={styles.label}>
							{report?.result?.is_healthy?.binary ? (
								<Heart color="#FF0000" fill="#FF0000" />
							) : (
								<HeartCrack color="#FF0000" />
							)}
							{(report.result.is_healthy.probability * 100).toFixed(1)}%
						</Text>
					</View>

					<Text style={[styles.selectionTitle, { marginTop: 20 }]}>Possible Issues</Text>
					{report.result.disease.suggestions.map((disease, index) => (
						<View key={index} style={styles.resultCard}>
							{disease.similar_images[0] && (
								<Image
									source={{ uri: disease.similar_images[0].url }}
									style={styles.resultImage}
								/>
							)}
							<View style={styles.resultContent}>
								<Text style={styles.resultName}>{disease.name}</Text>
								<Text style={styles.resultScientific}>
									Probability: {(disease.probability * 100).toFixed(1)}%
								</Text>
								<View style={styles.confidenceBadge}>
									<Text style={styles.confidenceText}>
										#{index + 1} Suggestion
									</Text>
								</View>
							</View>
						</View>
					))}

					<Button onPress={onReset} variant="secondary" style={{ marginTop: 20 }}>
						Scan Another Plant
					</Button>
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
		fontSize: 20,
		fontWeight: '700',
		color: '#283618',
	},
	label: {
		fontSize: 16,
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
		marginBottom: 8,
		color: '#555555',
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
