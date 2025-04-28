import React, { useEffect } from 'react';
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
import {
	Heart,
	HeartCrack,
	X,
	CircleCheck as CheckCircle,
	Plane as Plant,
} from 'lucide-react-native';
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
	const healthyAnimation = new Animated.Value(0);

	// Filter diseases with probability >= 1 %
	const significantDiseases = report.result.disease.suggestions.filter(
		(disease) => disease.probability >= 0.2
	);

	const isHealthy = report.result.is_healthy.probability > 0.66;

	// Animation for healthy plant screen
	useEffect(() => {
		if (isHealthy) {
			Animated.spring(healthyAnimation, {
				toValue: 1,
				tension: 50,
				friction: 7,
				useNativeDriver: true,
			}).start();
		}
	}, [isHealthy]);

	const imageTranslateY = scrollY.interpolate({
		inputRange: [0, 200],
		outputRange: [0, 100],
		extrapolate: 'clamp',
	});

	const healthyScale = healthyAnimation.interpolate({
		inputRange: [0, 1],
		outputRange: [0.8, 1],
	});

	const healthyOpacity = healthyAnimation.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 1],
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
				{/* ▾ Parallax header ▾ */}
				<View style={styles.parallaxContainer}>
					<View style={styles.parallaxBackground} />
					<Animated.Image
						source={{ uri: imageUri }}
						style={[styles.topImage, { transform: [{ translateY: imageTranslateY }] }]}
						resizeMode="cover"
					/>
				</View>

				{/* ▾ Results panel ▾ */}
				<View style={styles.resultsContent}>
					{/* Health status */}
					<View style={styles.healthStatusContainer}>
						<View style={styles.healthIconContainer}>
							{report.result.is_healthy.binary ? (
								<Heart size={28} color="#FF0000" fill="#FF0000" />
							) : (
								<HeartCrack size={28} color="#FF0000" />
							)}
						</View>
						<View style={styles.healthTextContainer}>
							<Text style={styles.healthTitle}>Plant Health</Text>
							<View
								style={[
									styles.healthPercentageBadge,
									{
										backgroundColor: isHealthy
											? COLORS.primary
											: COLORS.warning,
									},
								]}
							>
								<Text style={styles.healthPercentageText}>
									{(report.result.is_healthy.probability * 100).toFixed(1)}%
									Healthy
								</Text>
							</View>
						</View>
					</View>

					{/* Healthy plant message or issues list */}
					{isHealthy ? (
						<Animated.View
							style={[
								styles.healthyContainer,
								{ transform: [{ scale: healthyScale }], opacity: healthyOpacity },
							]}
						>
							<CheckCircle size={64} color="#3A8349" />
							<Text style={styles.healthyTitle}>Your Plant is Healthy!</Text>
							<Text style={styles.healthyDescription}>
								We couldn't detect any significant issues with your plant. Keep up
								the good work!
							</Text>
							<View style={styles.healthyTipsContainer}>
								<View style={styles.healthyTipItem}>
									<Plant size={22} color="#3A8349" />
									<Text style={styles.healthyTipText}>
										Continue your regular care routine
									</Text>
								</View>
							</View>
						</Animated.View>
					) : (
						<>
							<Text style={styles.selectionTitle}>Possible Issues</Text>

							{significantDiseases.length > 0 ? (
								significantDiseases.map((disease, index) => (
									<View key={index} style={styles.resultCard}>
										{/* Card header image */}
										{disease.similar_images[0] && (
											<Image
												source={{ uri: disease.similar_images[0].url }}
												style={styles.resultImage}
											/>
										)}

										{/* Card body */}
										<View style={styles.resultContent}>
											{/* Probability bar */}
											<View style={styles.probabilityContainer}>
												<Text style={styles.probabilityLabel}>
													Probability:{' '}
													{(disease.probability * 100).toFixed(1)}%
												</Text>
												<View style={styles.probabilityBarBackground}>
													<View
														style={[
															styles.probabilityBarFill,
															{
																width: `${
																	disease.probability * 100
																}%`,
																backgroundColor:
																	disease.probability > 0.7
																		? '#E57C23'
																		: disease.probability > 0.5
																		? '#F9A826'
																		: '#3A8349',
															},
														]}
													/>
												</View>
											</View>

											{/* Card text */}
											<Text style={styles.resultName}>{disease.name}</Text>
											{!!disease?.details?.description && (
												<Text style={styles.confidenceText}>
													{disease?.details?.description}
												</Text>
											)}
											{!!disease?.details?.cause && (
												<Text style={styles.confidenceText}>
													{disease?.details?.cause}
												</Text>
											)}
											{!!disease?.details?.treatment?.biological?.length && (
												<Text style={styles.confidenceText}>
													{disease?.details?.treatment?.biological?.join(
														', '
													)}
												</Text>
											)}
											{!!disease?.details?.treatment?.prevention?.length && (
												<Text style={styles.confidenceText}>
													{disease?.details?.treatment?.prevention?.join(
														', '
													)}
												</Text>
											)}
										</View>
									</View>
								))
							) : (
								<View style={styles.noIssuesContainer}>
									<Text style={styles.noIssuesText}>
										No significant issues detected with your plant.
									</Text>
								</View>
							)}
						</>
					)}
				</View>
			</Animated.ScrollView>
		</View>
	);
}

/* ─────────────────────────────────────────────
   Styles
   (only card-related definitions were updated)
   ───────────────────────────────────────────── */
const styles = StyleSheet.create({
	/* unchanged styles … */
	container: {
		flex: 1,
		backgroundColor: '#000',
	},
	scrollView: { flex: 1 },
	closeButton: {
		position: 'absolute',
		left: 20,
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(0,0,0,0.3)',
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
	parallaxBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
	topImage: { width: '100%', height: 320, position: 'absolute' },
	resultsContent: {
		padding: 24,
		backgroundColor: '#fff',
		borderTopLeftRadius: 30,
		borderTopRightRadius: 30,
		marginTop: -120,
	},
	healthStatusContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F8F9FA',
		borderRadius: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 5,
		elevation: 3,
	},
	healthIconContainer: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: '#FFF',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
		marginRight: 16,
	},
	healthTextContainer: { flex: 1 },
	healthTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#283618',
		marginBottom: 6,
	},
	healthPercentageBadge: {
		alignSelf: 'flex-start',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
	},
	healthPercentageText: { color: '#fff', fontWeight: '600', fontSize: 14 },
	selectionTitle: {
		color: '#283618',
		...COLORS.titleMd,
		marginTop: 16,
		marginBottom: 8,
	},

	/* ▾ UPDATED CARD STYLES ▾ */
	resultCard: {
		borderWidth: 2,
		borderColor: COLORS.border,
		borderRadius: 24,
		marginBottom: 24,
		marginHorizontal: 4,
		overflow: 'hidden',
		backgroundColor: '#FFFFFF',
		/* iOS shadow */
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		/* Android shadow */
		elevation: 6,
	},
	resultImage: {
		width: '100%',
		height: 220,
	},
	resultContent: {
		padding: 24,
	},
	resultName: {
		fontSize: 18,
		fontWeight: '700',
		color: '#283618',
		marginBottom: 12,
	},
	probabilityContainer: { marginBottom: 16 },
	probabilityLabel: {
		fontSize: 14,
		fontWeight: '500',
		color: '#555',
		marginBottom: 8,
	},
	probabilityBarBackground: {
		width: '100%',
		height: 10,
		backgroundColor: '#F0F0F0',
		borderRadius: 5,
		overflow: 'hidden',
	},
	probabilityBarFill: {
		height: '100%',
		borderRadius: 5,
	},
	confidenceText: {
		fontSize: 14,
		color: '#6B7280',
		lineHeight: 20,
		marginBottom: 6,
	},

	/* unchanged styles … */
	healthyContainer: {
		alignItems: 'center',
		marginVertical: 20,
		padding: 24,
		backgroundColor: '#F1F8E9',
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#C5E1A5',
	},
	healthyTitle: {
		fontSize: 22,
		fontWeight: '700',
		color: '#2E7D32',
		marginTop: 16,
		marginBottom: 8,
		textAlign: 'center',
	},
	healthyDescription: {
		fontSize: 16,
		color: '#33691E',
		textAlign: 'center',
		marginBottom: 20,
		lineHeight: 22,
	},
	healthyTipsContainer: {
		width: '100%',
		backgroundColor: 'white',
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: '#DCEDC8',
	},
	healthyTipItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
	healthyTipText: { marginLeft: 12, fontSize: 15, color: '#33691E' },
	noIssuesContainer: {
		padding: 20,
		alignItems: 'center',
		backgroundColor: '#EFF6EE',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#D8E8D4',
		marginBottom: 20,
	},
	noIssuesText: { fontSize: 16, color: '#3A5A40', textAlign: 'center' },
});
