import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withDelay,
	runOnJS,
} from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { COLORS } from '@/app/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TourHighlightProps {
	title: string;
	description: string;
	onNext: () => void;
	position?: 'top' | 'bottom';
	visible: boolean;
}

export function TourHighlight({ title, description, onNext, visible }: TourHighlightProps) {
	// local mount state
	const [mounted, setMounted] = useState(visible);

	const opacity = useSharedValue(0);
	const translateY = useSharedValue(50);

	useEffect(() => {
		if (visible) {
			// mount & animate in
			setMounted(true);
			opacity.value = withDelay(300, withSpring(1, { damping: 15 }));
			translateY.value = withDelay(300, withSpring(0, { damping: 15 }));
		} else {
			// animate out, then unmount
			opacity.value = withSpring(0, { damping: 15 }, (finished) => {
				if (finished) runOnJS(setMounted)(false);
			});
			translateY.value = withSpring(50);
		}
	}, [visible, opacity, translateY]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateY: translateY.value }],
	}));

	// only actually remove from tree once exit animation completes
	if (!mounted) return null;

	return (
		<View style={styles.backdrop} pointerEvents={visible ? 'auto' : 'none'}>
			<Animated.View style={[styles.container, animatedStyle]}>
				<View style={styles.content}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.description}>{description}</Text>
					<TouchableOpacity style={styles.button} onPress={onNext}>
						<Text style={styles.buttonText}>Got it</Text>
					</TouchableOpacity>
				</View>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		justifyContent: 'center',
		alignItems: 'center',
		width: SCREEN_WIDTH,
		height: '100%',
		zIndex: 999,
	},
	container: {
		zIndex: 1000,
		position: 'absolute',
		left: 20,
		right: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.98)',
		borderRadius: 16,
		padding: 20,
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.15,
				shadowRadius: 8,
			},
			android: {
				elevation: 4,
			},
		}),
	},
	content: {
		alignItems: 'center',
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: COLORS.text.primary.light,
		marginBottom: 8,
		textAlign: 'center',
	},
	description: {
		fontSize: 16,
		color: COLORS.text.secondary.light,
		textAlign: 'center',
		marginBottom: 20,
		lineHeight: 24,
	},
	button: {
		backgroundColor: COLORS.primary,
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 24,
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
});
