import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Animated,
	Easing,
	SafeAreaView,
	StyleSheet,
	useWindowDimensions,
	View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useMixpanel } from '@/hooks/useMixpanel';

// ────────────────────────────────────────────────────────────────────────────────
// MOCK ASSETS (swap these for local/remote URIs)
// ────────────────────────────────────────────────────────────────────────────────
const PLANT_IMAGES = [
	'https://leafly-app.s3.eu-west-2.amazonaws.com/Taking+care+of+plants-02.svg',
	'https://leafly-app.s3.eu-west-2.amazonaws.com/Taking+care+of+plants-02.svg',
	'https://leafly-app.s3.eu-west-2.amazonaws.com/Taking+care+of+plants-02.svg',
	'https://leafly-app.s3.eu-west-2.amazonaws.com/Taking+care+of+plants-02.svg',
	'https://leafly-app.s3.eu-west-2.amazonaws.com/Taking+care+of+plants-02.svg',
];

// ────────────────────────────────────────────────────────────────────────────────
// PROGRESS RING
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
// MAIN SCREEN
// ────────────────────────────────────────────────────────────────────────────────
const LOADING_DURATION_MS = 5000; // total time until 100 %
const NEXT_ROUTE = 'Home'; // customise to your route id

const GeneratingScreen: React.FC = () => {
	const { width } = useWindowDimensions();
	const [progress, setProgress] = useState<number>(0);
	const navigation = useNavigation();
	useMixpanel('generating');

	// Increment % evenly over LOADING_DURATION_MS
	useEffect(() => {
		const step = 100 / (LOADING_DURATION_MS / 50); // update every 50 ms
		const id = setInterval(async () => {
			await AsyncStorage.setItem('onboarding_completed', 'true');

			setProgress((p) => {
				const next = Math.min(p + step, 100);
				if (next >= 100) {
					clearInterval(id);
					// Small timeout so the user sees 100 %
					setTimeout(() => {
						router.replace('/(auth)/register');
					}, 300);
				}
				return next;
			});
		}, 50);
		return () => clearInterval(id);
	}, [navigation]);

	const insets = useSafeAreaInsets();

	return (
		<SafeAreaView style={styles.root}>
			{/* headline */}
			<View style={[styles.headlineWrapper]}>
				<Text style={styles.statNumber}>35 000+</Text>
				<Text style={styles.statLabel}>Plants Thriving</Text>
				<Text style={styles.statSubText}>
					Discover a wide variety of life forms, including houseplants, ornamentals,
					trees, and weeds.
				</Text>
			</View>

			<View
				style={{
					flex: 1,
					width: '100%',
					height: '65%',
					position: 'absolute',
					bottom: '22%',
					left: 0,
					zIndex: 20,
				}}
			>
				<Image
					style={{
						flex: 1,
						width: '100%',
						height: '100%',
						...COLORS.shadow,
					}}
					source={PLANT_IMAGES[0]}
					contentFit="cover"
					transition={0}
				/>
			</View>
			{/* plant pyramid over pitch graphic */}

			{/* angled green footer with progress */}
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
	// headline
	headlineWrapper: {
		alignItems: 'center',
		zIndex: 30,
		paddingHorizontal: 24,
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
	// plant pyramid
	pitchWrapper: {
		marginTop: 48,
		alignItems: 'center',
	},
	pyramidWrapper: {
		width: 240,
	},
	pyramidRow: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	plantAvatar: {
		width: 60,
		height: 60,
		borderRadius: 30,
		borderWidth: 4,
		borderColor: '#fff',
		marginHorizontal: 4,
		marginVertical: 4,
	},
	// green footer
	greenSection: {
		marginTop: 'auto',
		alignItems: 'center',
		justifyContent: 'center',
		display: 'flex',
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
