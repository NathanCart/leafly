import React, { useRef, useState } from 'react';
import {
	TouchableOpacity,
	Animated,
	StyleSheet,
	View,
	Dimensions,
	UIManager,
	findNodeHandle,
	LayoutRectangle,
} from 'react-native';
import { Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HeartButtonProps {
	isFavorite: boolean;
	onToggle: () => void;
	size?: number;
	style?: any;
	color: string;
}

interface ParticleProps {
	startX: number;
	startY: number;
	color: string;
}

const Particle = ({ startX, startY, color }: ParticleProps) => {
	const translateX = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(0)).current;
	const scale = useRef(new Animated.Value(1)).current;
	const opacity = useRef(new Animated.Value(1)).current;

	React.useEffect(() => {
		const angle = Math.random() * Math.PI * 2;
		const distance = 60 + Math.random() * 60;

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

		Animated.parallel([
			Animated.timing(translateX, {
				toValue: Math.cos(angle) * distance,
				duration: 500,
				useNativeDriver: true,
			}),
			Animated.timing(translateY, {
				toValue: Math.sin(angle) * distance,
				duration: 500,
				useNativeDriver: true,
			}),
			Animated.sequence([
				Animated.spring(scale, {
					toValue: 1.5,
					friction: 4,
					tension: 200,
					useNativeDriver: true,
				}),
				Animated.timing(scale, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}),
			]),
			Animated.timing(opacity, {
				toValue: 0,
				duration: 500,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	return (
		<Animated.View
			style={[
				styles.particle,
				{
					left: startX - 5, // center the heart
					top: startY - 5,
					transform: [
						{ translateX },
						{ translateY },
						{ scale },
						{ rotate: `${Math.random() * 360}deg` },
					],
					opacity,
				},
			]}
		>
			<Heart size={10} color={color} fill={color} />
		</Animated.View>
	);
};

export const HeartButton = ({
	isFavorite,
	onToggle,
	size = 24,
	style,
	color,
}: HeartButtonProps) => {
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
	const nextParticleId = useRef(0);
	const buttonRef = useRef<View>(null);

	const triggerParticles = () => {
		if (!buttonRef.current) return;

		const handle = findNodeHandle(buttonRef.current);
		if (!handle) return;

		UIManager.measure(handle, (_x, _y, width, height, pageX, pageY) => {
			const centerX = pageX + width / 2;
			const centerY = pageY + height / 2;

			const newParticles = Array.from({ length: 8 }).map(() => ({
				id: nextParticleId.current++,
				x: centerX,
				y: centerY,
			}));

			setParticles((prev) => [...prev, ...newParticles]);

			setTimeout(() => {
				setParticles((prev) =>
					prev.filter((p) => !newParticles.find((np) => np.id === p.id))
				);
			}, 600);
		});
	};

	const animateHeart = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		Animated.sequence([
			Animated.spring(scaleAnim, {
				toValue: 1.6,
				useNativeDriver: true,
				friction: 3,
				tension: 300,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				useNativeDriver: true,
				friction: 3,
				tension: 200,
			}),
		]).start(() => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // second point
		});

		triggerParticles();
		onToggle();
	};

	return (
		<>
			<View
				style={[
					StyleSheet.absoluteFill,
					{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, zIndex: 999 },
				]}
				pointerEvents="none"
			>
				{particles.map((particle) => (
					<Particle
						key={particle.id}
						startX={particle.x}
						startY={particle.y}
						color={color}
					/>
				))}
			</View>

			<TouchableOpacity onPress={animateHeart} activeOpacity={0.6} style={style}>
				<View ref={buttonRef}>
					<Animated.View
						style={[styles.heartContainer, { transform: [{ scale: scaleAnim }] }]}
					>
						<Heart
							size={size}
							color={color}
							fill={isFavorite ? color : 'transparent'}
							strokeWidth={2}
						/>
					</Animated.View>
				</View>
			</TouchableOpacity>
		</>
	);
};

const styles = StyleSheet.create({
	heartContainer: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	particle: {
		position: 'absolute',
		width: 10,
		height: 10,
		zIndex: 999,
	},
});
