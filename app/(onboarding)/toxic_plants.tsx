import { StyleSheet, SafeAreaView, TouchableOpacity, View, Platform } from 'react-native';
import { Text } from '@/components/Text';
import { useMixpanel } from '@/hooks/useMixpanel';
import { router } from 'expo-router';
import { COLORS } from '../constants/colors';
import React from 'react';
import Svg, { Circle, Rect, Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import * as Haptics from 'expo-haptics'; // ← Import Haptics

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

// ---------------------------------------------
// Options configuration
// ---------------------------------------------
const FIND_OPTIONS: { key: string; label: string }[] = [
	{ key: 'yes', label: 'Yes' },
	{ key: 'no', label: 'No' },
];

export default function ToxicPlants() {
	useMixpanel('toxic_plants');

	// Fire a light haptic before navigating
	const handleSelect = async (key: string) => {
		await Haptics.selectionAsync();
		router.push('/overwhelmed'); // replace with your actual next route
	};

	const handleSkip = async () => {
		await Haptics.selectionAsync();
		router.push('/overwhelmed');
	};

	return (
		<SafeAreaView style={styles.container}>
			{/* Decorative background art (non-interactive) */}
			<View style={styles.artwork} pointerEvents="none">
				<SunSvg style={[styles.sunSvg]} />
			</View>

			<Text style={styles.title}>
				"I'm get worried my plants may be{' '}
				<Text style={{ color: COLORS.primary, fontWeight: 'black' }}>toxic</Text> for my
				pets"
			</Text>

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

			{/* Skip Button */}
			<View style={{ paddingHorizontal: 16, marginTop: 'auto' }}>
				<Button variant="secondary" onPress={handleSkip} size="large">
					Skip
				</Button>
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
		backgroundColor: '#E6F2FF',
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
	skipBtn: {},
	skipText: {
		fontSize: 16,
		fontWeight: '600',
		color: COLORS.muted,
	},
	title: {
		fontSize: 24,
		paddingHorizontal: 16,
		fontWeight: '700',
		textAlign: 'center',
		marginVertical: 32,
	},
	optionsContainer: {
		paddingHorizontal: 16,
	},
	optionCard: {
		backgroundColor: 'rgba(255,255,255,0.9)',
		paddingVertical: 20,
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
