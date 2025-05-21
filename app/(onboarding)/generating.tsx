import React, { useEffect, useRef, useState } from 'react';
import {
	Animated,
	Easing,
	SafeAreaView,
	StyleSheet,
	useWindowDimensions,
	View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '@/components/Text';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { FlatList } from 'react-native-gesture-handler';
import { useMixpanel } from '@/hooks/useMixpanel';
import { router } from 'expo-router';

// ────────────────────────────────────────────────────────────────────────────────
// SLIDER DATA
// ────────────────────────────────────────────────────────────────────────────────
const SLIDES = [
	{
		key: 'thriving',
		statNumber: '35,000+',
		statLabel: 'Plants Thriving',
		statSubText:
			'Discover a wide variety of life forms, including houseplants, ornamentals, trees, and weeds.',
		image: 'https://leafly-app.s3.eu-west-2.amazonaws.com/Taking+care+of+plants-02.svg',
	},

	{
		key: 'reminders',
		statNumber: '8 M+',
		statLabel: 'Smart Reminders',
		statSubText: 'Millions of tailored care reminders sent every month.',
		image: 'https://leafly-app.s3.eu-west-2.amazonaws.com/smart-reminders.svg',
	},
	{
		key: 'identified',
		statNumber: '90+',
		statLabel: 'Plant Pests',
		statSubText:
			'Access almost a hundred carefully selected pests and diseases, caused by fungal, bacterial, viral and abiotic factors.',
		image: 'https://leafly-app.s3.eu-west-2.amazonaws.com/identify-plant.svg',
	},
];

// ────────────────────────────────────────────────────────────────────────────────
// PROGRESS RING COMPONENT (unchanged)
// ────────────────────────────────────────────────────────────────────────────────
export const ProgressCircle: React.FC<{
	/** Percentage value (0-100). */ progress: number;
	/** Diameter of the circle. */ size?: number;
	/** Stroke / accent colour. */ color?: string;
	/** Track / background colour. */ trackColor?: string;
	/** Thickness of the ring (defaults to 10 % of size). */ strokeWidthRatio?: number;
}> = ({
	progress,
	size = 120,
	color = COLORS.primary ?? '#00B36B',
	trackColor = COLORS.card?.light ?? '#E6F2FF',
	strokeWidthRatio = 0.1,
}) => {
	const strokeWidth = size * strokeWidthRatio;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	// Animated value drives the strokeDashoffset.
	const animated = useRef(new Animated.Value(progress)).current;

	useEffect(() => {
		Animated.timing(animated, {
			toValue: progress,
			duration: 500,
			easing: Easing.out(Easing.quad),
			useNativeDriver: false,
		}).start();
	}, [progress, animated]);

	const strokeDashoffset = animated.interpolate({
		inputRange: [0, 100],
		outputRange: [circumference, 0],
		extrapolate: 'clamp',
	});

	const AnimatedCircle = Animated.createAnimatedComponent(Circle);

	return (
		<View style={[styles.progressContainer, { width: size, height: size }]}>
			<Svg width={size} height={size}>
				<Circle
					stroke={trackColor}
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
					fill="none"
				/>
				<AnimatedCircle
					stroke={color}
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={`${circumference} ${circumference}`}
					strokeDashoffset={strokeDashoffset}
					fill="none"
					transform={`rotate(-90 ${size / 2} ${size / 2})`}
				/>
			</Svg>
			<Text style={styles.progressText}>{Math.round(progress)}%</Text>
		</View>
	);
};

// ────────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN WITH AUTOPLAY SLIDER
// ────────────────────────────────────────────────────────────────────────────────
const LOADING_DURATION_MS = 7000; // total time until 100 %
const AUTOPLAY_INTERVAL_MS = 3333; // slider autoplay

const GeneratingScreen: React.FC = () => {
	const { width } = useWindowDimensions();
	const flatListRef = useRef<FlatList>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [progress, setProgress] = useState<number>(0);
	const insets = useSafeAreaInsets();

	useMixpanel('generating');

	// ── Increment % evenly over LOADING_DURATION_MS ────────────────────────────
	useEffect(() => {
		const step = 100 / (LOADING_DURATION_MS / 50); // update every 50 ms
		const id = setInterval(async () => {
			await AsyncStorage.setItem('onboarding_completed', 'true');

			setProgress((p) => {
				const next = Math.min(p + step, 100);
				if (next >= 100) {
					clearInterval(id);

					setTimeout(() => {
						router.replace('/(auth)/login');
					}, 300);
				}
				return next;
			});
		}, 50);
		return () => clearInterval(id);
	}, []);

	// ── Slider Autoplay ────────────────────────────────────────────────────────
	useEffect(() => {
		const autoplayId = setInterval(() => {
			const nextIndex = (currentIndex + 1) % SLIDES.length;
			flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
			setCurrentIndex(nextIndex);
		}, AUTOPLAY_INTERVAL_MS);
		return () => clearInterval(autoplayId);
	}, [currentIndex]);

	// Update index when user swipes (keeps autoplay in sync)
	const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
		if (viewableItems.length > 0) {
			setCurrentIndex(viewableItems[0].index);
		}
	}).current;

	const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

	return (
		<SafeAreaView style={styles.root}>
			{/* ── Slider ─────────────────────────────────────────────────────────── */}
			<FlatList
				ref={flatListRef}
				data={SLIDES}
				keyExtractor={(item) => item.key}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				bounces={false}
				onViewableItemsChanged={onViewableItemsChanged}
				viewabilityConfig={viewConfigRef.current}
				renderItem={({ item }) => (
					<View style={[styles.slide, { width }]}>
						{/* Headline */}
						<View style={styles.headlineWrapper}>
							<Text style={styles.statNumber}>{item.statNumber}</Text>
							<Text style={styles.statLabel}>{item.statLabel}</Text>
							<Text style={styles.statSubText}>{item.statSubText}</Text>
						</View>

						{/* Illustration (original absolute styling) */}
						<View style={styles.imageWrapper}>
							<Image
								style={styles.image}
								source={item.image}
								contentFit="cover"
								transition={0}
							/>
						</View>
					</View>
				)}
			/>

			{/* ── Green Footer with Progress ─────────────────────────────────────── */}
			<View style={[styles.greenSection, { width, marginBottom: -insets.bottom }]}>
				<ProgressCircle progress={progress} size={120} />
				<Text style={styles.loadingText}>Creating your personal journey…</Text>
			</View>
		</SafeAreaView>
	);
};

export default GeneratingScreen;

// ────────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
	root: {
		flex: 1,
		position: 'relative',
		backgroundColor: '#E6F2FF',
	},
	// slider slide container
	slide: {
		flex: 1,
		position: 'relative',
		alignItems: 'center',
	},
	// headline
	headlineWrapper: {
		alignItems: 'center',
		zIndex: 30,
		paddingHorizontal: 24,
		marginTop: 24,
	},
	statNumber: {
		fontSize: 60,
		fontWeight: '800',
		color: COLORS.primary ?? '#00A36C',
	},
	statLabel: {
		fontSize: 40,
		fontWeight: '700',
		color: COLORS.primary ?? '#00A36C',
	},
	statSubText: {
		fontSize: 18,
		textAlign: 'center',
		marginTop: 12,
		lineHeight: 24,
		color: '#4B5563',
	},
	// illustration (original styling)
	imageWrapper: {
		flex: 1,
		width: '100%',
		height: '65%',
		paddingTop: 8,
		bottom: '0%',
		left: 0,
		paddingHorizontal: 24,
		zIndex: 40,
	},
	image: {
		flex: 1,
		width: '100%',
		height: '100%',
		...COLORS.shadow,
	},
	// green footer
	greenSection: {
		alignItems: 'center',
		justifyContent: 'center',
		height: '37.45%',
		borderTopLeftRadius: 40,
		backgroundColor: COLORS.card.light,
		borderTopRightRadius: 40,
		...COLORS.shadow,
	},
	loadingText: {
		color: '#4B5563',
		fontSize: 16,
		marginTop: 24,
	},
	// progress circle shared
	progressContainer: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	progressText: {
		position: 'absolute',
		fontSize: 22,
		fontWeight: '700',
		color: COLORS.primary,
	},
});
