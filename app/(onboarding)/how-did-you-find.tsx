import { StyleSheet, SafeAreaView, TouchableOpacity, View, Platform } from 'react-native';
import { Text } from '@/components/Text';
import { useMixpanel } from '@/hooks/useMixpanel';
import { router } from 'expo-router';
import { COLORS } from '../constants/colors';
import React from 'react';
import Svg, { Circle, Rect, Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ---------------------------------------------
// Decorative environment-based SVG illustrations
// ---------------------------------------------
export const SunSvg = (
	{
		size = 96,
		style,
	}: {
		size?: number | string;
		style?: object;
	} = {
		size: 96,
		style: {},
	}
) => (
	<Svg width={size} height={size} viewBox="0 0 64 64" style={style} fill="none">
		{/* GRADIENT DEFINITIONS */}
		<Defs>
			<LinearGradient id="sunGradient" x1="0%" y1="0%" x2="0%" y2="100%">
				<Stop offset="0%" stopColor="#FFE97D" />
				<Stop offset="100%" stopColor="#FFC107" />
			</LinearGradient>
			<LinearGradient id="rayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
				<Stop offset="0%" stopColor="#FFF59D" stopOpacity="0.9" />
				<Stop offset="100%" stopColor="#FFE082" stopOpacity="0.6" />
			</LinearGradient>
		</Defs>

		{/* SUN DISC */}
		<Circle cx="32" cy="32" r="16" fill="url(#sunGradient)" />

		{/* RAYS */}
		{Array.from({ length: 12 }).map((_, i) => (
			<Rect
				key={i}
				x={31}
				y={4}
				width={2}
				height={10}
				rx={1}
				fill="url(#rayGradient)"
				transform={`rotate(${i * 30} 32 32)`}
			/>
		))}
	</Svg>
);

export const HillSvg = ({
	width = '100%',
	height = 180,
	style,
}: {
	width?: number | string;
	height?: number | string;
	style?: object;
}) => (
	<Svg
		width={width}
		height={height}
		viewBox="0 0 360 180"
		preserveAspectRatio="xMidYMax slice"
		style={style}
		fill="none"
	>
		<Defs>
			<LinearGradient id="hillGradientNear" x1="0%" y1="0%" x2="0%" y2="100%">
				<Stop offset="0%" stopColor="#A5D6A7" />
				<Stop offset="100%" stopColor="#81C784" />
			</LinearGradient>
			<LinearGradient id="hillGradientFar" x1="0%" y1="0%" x2="0%" y2="100%">
				<Stop offset="0%" stopColor="#C8E6C9" />
				<Stop offset="100%" stopColor="#A5D6A7" />
			</LinearGradient>
		</Defs>

		{/* FAR HILL */}
		<Path
			d="M0 100 C60 40, 120 40, 180 100 S300 160, 360 100 V180 H0 Z"
			fill="url(#hillGradientFar)"
		/>

		{/* NEAR HILL */}
		<Path
			d="M0 140 C80 80, 160 80, 240 140 S320 200, 360 140 V180 H0 Z"
			fill="url(#hillGradientNear)"
		/>

		{/* OPTIONAL: Simple shadow to add depth */}
		<G opacity={0.08}>
			<Path d="M0 140 C80 80, 160 80, 240 140 S320 200, 360 140 V180 H0 Z" fill="#000" />
		</G>
	</Svg>
);

// ---------------------------------------------
// Options configuration
// ---------------------------------------------
const FIND_OPTIONS: { key: string; label: string }[] = [
	{ key: 'friend', label: 'A friend recommended it' },
	{ key: 'search', label: 'Searching the App Store' },
	{ key: 'tiktok', label: 'A TikTok short' },
	{ key: 'youtube', label: 'A YouTube short' },
	{ key: 'instagram', label: 'An Instagram Reel' },
	{ key: 'ad', label: 'I saw an ad' },
	{ key: 'other', label: 'Other' },
];

export default function HowDidYouFindScreen() {
	useMixpanel('how_did_you_find');

	const handleSelect = (key: string) => {
		router.push('/how-many-plants'); // replace with your actual next route
	};

	const handleSkip = () => {
		router.push('/how-many-plants');
	};

	const insets = useSafeAreaInsets();

	return (
		<SafeAreaView style={styles.container}>
			{/* Decorative background art (non-interactive) */}
			<View style={styles.artwork} pointerEvents="none">
				<SunSvg style={[styles.sunSvg]} />
				<HillSvg style={[{ ...styles.hillSvg, bottom: -insets.bottom - insets.top }]} />
			</View>

			{/* Skip Button */}
			<TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
				<Text style={styles.skipText}>Skip</Text>
			</TouchableOpacity>

			<Text style={styles.title}>How did you find Florai?</Text>

			<View style={styles.optionsContainer}>
				{FIND_OPTIONS.map(({ key, label }) => (
					<TouchableOpacity
						key={key}
						style={styles.optionCard}
						activeOpacity={0.7}
						onPress={() => handleSelect(key)}
					>
						<Text style={styles.optionText}>{label}</Text>
					</TouchableOpacity>
				))}
			</View>
		</SafeAreaView>
	);
}

// ---------------------------------------------
// Styles
// ---------------------------------------------
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#E3F2FD', // soft sky-blue backdrop
		justifyContent: 'flex-start',
	},
	artwork: {
		flex: 1,
		height: '100%',
		...StyleSheet.absoluteFillObject,
		justifyContent: 'flex-start',
		alignItems: 'center',
		width: '100%',
	},
	sunSvg: {
		position: 'absolute',
	},
	hillSvg: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		width: '100%',
		height: 180, // match the height you passed into HillSvg
	},
	skipBtn: {
		position: 'absolute',
		top: Platform.OS === 'ios' ? 50 : 20,
		right: 20,
		padding: 8,
		zIndex: 1,
	},
	skipText: {
		fontSize: 16,
		fontWeight: '600',
		color: COLORS.muted,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		textAlign: 'center',
		marginVertical: 32,
	},
	optionsContainer: {
		paddingHorizontal: 16,
	},
	optionCard: {
		backgroundColor: 'rgba(255,255,255,0.9)',
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderRadius: 16,
		marginBottom: 16,
	},
	optionText: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
	},
});
