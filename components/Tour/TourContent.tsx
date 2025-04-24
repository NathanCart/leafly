// TourStepContent.tsx
import React from 'react';
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

const { width: W, height: H } = Dimensions.get('window');

interface Props {
	title: string;
	description: string;
	position: 'top' | 'bottom';
	onExitAnimationDone: () => void;
	trigger: number; // bump this when you want to re-animate in
}

export function TourStepContent({
	title,
	description,
	position,
	onExitAnimationDone,
	trigger,
}: Props) {
	const opacity = useSharedValue(0);
	const translateY = useSharedValue(position === 'bottom' ? 50 : -50);

	// whenever `trigger` increments, we animate in
	React.useEffect(() => {
		opacity.value = withDelay(300, withSpring(1, { damping: 15 }));
		translateY.value = withDelay(300, withSpring(0, { damping: 15 }));
	}, [trigger]);

	// call this to start the “out” anim
	const hide = () => {
		opacity.value = withSpring(0, { damping: 15 });
		translateY.value = withSpring(
			position === 'bottom' ? 50 : -50,
			{ damping: 15 },
			(finished) => {
				if (finished) runOnJS(onExitAnimationDone)();
			}
		);
	};

	const style = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateY: translateY.value }],
	}));

	return (
		<Animated.View style={[styles.container, style]}>
			<View style={styles.content}>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.description}>{description}</Text>
				<TouchableOpacity style={styles.button} onPress={hide}>
					<Text style={styles.buttonText}>Got it</Text>
				</TouchableOpacity>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		zIndex: 9999,
		width: W * 0.9,
		height: H * 0.5,
		backgroundColor: 'rgba(255,255,255,0.98)',
		borderRadius: 16,
		paddingHorizontal: 20,
		justifyContent: 'center',
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.15,
				shadowRadius: 8,
			},
			android: { elevation: 4 },
		}),
	},
	content: { alignItems: 'center' },
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
	buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
