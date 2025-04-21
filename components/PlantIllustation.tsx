import { COLORS } from '@/app/constants/colors';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { Path, Svg } from 'react-native-svg';

export const PlantIllustration = ({ size = 120, color = COLORS.primary }) => {
	const scaleAnim = useRef(new Animated.Value(0)).current;
	useFocusEffect(
		useCallback(() => {
			scaleAnim.setValue(0);
			Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
		}, [])
	);

	return (
		<View style={styles.emptyState}>
			<Animated.View
				style={[styles.plantIllustration, { transform: [{ scale: scaleAnim }] }]}
			>
				<View style={styles.plantPot} />
				<View style={styles.plantLeaves}>
					<View style={[styles.leaf, styles.leafLeft]} />
					<View style={[styles.leaf, styles.leafMiddle]} />
					<View style={[styles.leaf, styles.leafRight]} />
				</View>
				<Text style={[styles.sparkle, styles.sparkleTopLeft]}>★</Text>
				<Text style={[styles.sparkle, styles.sparkleTopRight]}>★</Text>
				<Text style={[styles.sparkle, styles.sparkleBottom]}>★</Text>
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	container: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	plantIllustration: { width: 192, height: 192, position: 'relative' },
	plantPot: {
		position: 'absolute',
		bottom: 32,
		left: '50%',
		marginLeft: -32,
		width: 64,
		height: 64,
		backgroundColor: '#CC7154',
		borderRadius: 8,
	},
	plantLeaves: {
		position: 'absolute',
		bottom: 96,
		left: '50%',
		marginLeft: -48,
		width: 96,
		height: 128,
	},
	leaf: {
		position: 'absolute',
		width: 32,
		height: 48,
		backgroundColor: '#34D399',
		borderRadius: 24,
	},
	leafLeft: { bottom: 0, left: 0, transform: [{ rotate: '-15deg' }] },
	leafMiddle: { bottom: 16, left: 16, height: 64 },
	leafRight: { bottom: 0, right: 0, transform: [{ rotate: '15deg' }] },
	sparkle: { position: 'absolute', fontSize: 24, color: '#FBBF24' },
	sparkleTopLeft: { top: 0, left: 0 },
	sparkleTopRight: { top: 32, right: 0 },
	sparkleBottom: { bottom: 80, left: 0 },
});
