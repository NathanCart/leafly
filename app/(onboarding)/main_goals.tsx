import {
	StyleSheet,
	SafeAreaView,
	TouchableOpacity,
	View,
	Platform,
	ScrollView,
} from 'react-native';
import { Text } from '@/components/Text';
import { useMixpanel } from '@/hooks/useMixpanel';
import { router } from 'expo-router';
import { COLORS } from '../constants/colors';
import React, { useState } from 'react';
import Svg, { Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics'; // ← Import Haptics
import { Button } from '@/components/Button';

// ... SunSvg unchanged ...
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
const FIND_OPTIONS: { key: string; label: string }[] = [
	{ key: 'watering_reminders', label: '💧 Get Watering Reminders' },
	{ key: 'plant_identification', label: '📸 Plant Identification' },
	{ key: 'toxic', label: '☠️ Check plant toxicity' },
	{ key: 'community_support', label: '💪 Community Support' },
	{ key: 'plant_journal', label: '📔 Plant Journal' },
	{ key: 'plant_health_tracking', label: '🏥 Plant Health Tracking' },
	{ key: 'other', label: '💡 Discover New Plants' },
];

export default function MainGoals() {
	useMixpanel('main_goals');

	const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

	// Toggle one goal on/off
	const handleToggle = async (key: string) => {
		await Haptics.selectionAsync();
		setSelectedGoals((prev) =>
			prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
		);
	};

	// Navigate when you're done picking
	const handleContinue = async () => {
		await Haptics.selectionAsync();
		// you can send `selectedGoals` to your backend or store here
		router.push('/features');
	};

	const handleSkip = async () => {
		await Haptics.selectionAsync();
		router.push('/features');
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.artwork} pointerEvents="none">
				<SunSvg style={styles.sunSvg} />
			</View>

			<Text style={styles.title}>Choose your top goals</Text>

			<ScrollView style={styles.optionsContainer}>
				{FIND_OPTIONS.map(({ key, label }) => {
					const isSelected = selectedGoals.includes(key);
					return (
						<TouchableOpacity
							key={key}
							style={[styles.optionCard, isSelected && styles.optionCardSelected]}
							activeOpacity={0.7}
							onPress={() => handleToggle(key)}
						>
							<Text
								style={[styles.optionText, isSelected && styles.optionTextSelected]}
							>
								{label}
							</Text>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			<View style={styles.footer}>
				<Button onPress={handleContinue} disabled={selectedGoals.length === 0} size="large">
					Continue
				</Button>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#E6F2FF',
	},
	artwork: {
		flex: 1,
		...StyleSheet.absoluteFillObject,
		justifyContent: 'flex-start',
		alignItems: 'center',
	},
	sunSvg: {
		position: 'absolute',
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		textAlign: 'center',
		marginVertical: 32,
	},
	optionsContainer: {
		flex: 1,
		paddingHorizontal: 16,
	},
	optionCard: {
		backgroundColor: 'rgba(255,255,255,0.9)',
		paddingVertical: 20,
		paddingHorizontal: 20,
		borderRadius: 16,
		marginBottom: 16,
	},
	optionCardSelected: {
		backgroundColor: COLORS.primary, // highlight color
	},
	optionText: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
		color: '#000',
	},
	optionTextSelected: {
		color: '#fff',
	},
	footer: {
		padding: 16,
	},
	skipBtn: {
		marginTop: 12,
	},
});
