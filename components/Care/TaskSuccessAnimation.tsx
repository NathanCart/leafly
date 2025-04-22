import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { Droplet, Sparkle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PlantIllustration } from '../PlantIllustation';
import { COLORS } from '@/app/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_PARTICLES = 30; // Increased number of particles
const NUM_DROPLETS = 5; // Multiple droplets

type Particle = {
	animation: Animated.Value;
	translateX: number;
	translateY: number;
	scale: number;
	rotate: number;
	delay: number;
};

type Droplet = {
	animation: Animated.Value;
	translateX: number;
	scale: number;
	delay: number;
};

type TaskSuccessAnimationProps = {
	type: 'Water' | 'Fertilize';
	onAnimationComplete: () => void;
};

const createParticle = (): Particle => ({
	animation: new Animated.Value(0),
	translateX: (Math.random() - 0.5) * SCREEN_WIDTH * 0.8,
	translateY: Math.random() * SCREEN_HEIGHT * 0.3 - SCREEN_HEIGHT * 0.15,
	scale: Math.random() * 0.5 + 0.5,
	rotate: Math.random() * 360,
	delay: Math.random() * 500,
});

const createDroplet = (index: number): Droplet => ({
	animation: new Animated.Value(0),
	translateX: (Math.random() - 0.5) * 60,
	scale: Math.random() * 0.3 + 0.7,
	delay: index * 150,
});

export const TaskSuccessAnimation = ({ type, onAnimationComplete }: TaskSuccessAnimationProps) => {
	const isWatering = type === 'Water';
	const accentColor = isWatering ? '#33A1FF' : '#4CAF50';
	const backgroundAccentColor = isWatering ? '#E0F7FF' : '#E8F5E9';

	const scaleAnim = useRef(new Animated.Value(0)).current;
	const textAnim = useRef(new Animated.Value(0)).current;
	const plantAnim = useRef(new Animated.Value(1)).current;
	const glowAnim = useRef(new Animated.Value(0)).current;

	const particles = useRef<Particle[]>(
		Array.from({ length: NUM_PARTICLES }, () => createParticle())
	).current;

	const droplets = useRef<Droplet[]>(
		Array.from({ length: NUM_DROPLETS }, (_, i) => createDroplet(i))
	).current;

	useEffect(() => {
		// Initial impact haptic
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

		// Plant bounce and glow animation
		Animated.sequence([
			Animated.timing(plantAnim, {
				toValue: 0.95,
				duration: 200,
				useNativeDriver: true,
			}),
			Animated.parallel([
				Animated.spring(plantAnim, {
					toValue: 1,
					friction: 3,
					useNativeDriver: true,
				}),
				Animated.timing(glowAnim, {
					toValue: 1,
					duration: 800,
					useNativeDriver: true,
				}),
			]),
		]).start();

		// Droplet animations with haptic feedback
		droplets.forEach((droplet, index) => {
			Animated.sequence([
				Animated.delay(droplet.delay),
				Animated.timing(droplet.animation, {
					toValue: 1,
					duration: 1000,
					easing: Easing.bezier(0.4, 0, 0.2, 1),
					useNativeDriver: true,
				}),
			]).start(() => {
				if (index % 2 === 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			});
		});

		// Particle animations with staggered timing
		particles.forEach((particle, index) => {
			Animated.sequence([
				Animated.delay(800 + particle.delay),
				Animated.timing(particle.animation, {
					toValue: 1,
					duration: 1500,
					easing: Easing.bezier(0.4, 0, 0.2, 1),
					useNativeDriver: true,
				}),
			]).start(() => {
				if (index % 5 === 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			});
		});

		// Success text animation with bounce effect
		Animated.sequence([
			Animated.delay(1300),
			Animated.spring(scaleAnim, {
				toValue: 1.1,
				friction: 8,
				tension: 40,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				friction: 8,
				tension: 40,
				useNativeDriver: true,
			}),
			Animated.timing(textAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
		]).start(() => {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			setTimeout(onAnimationComplete, 1500);
		});
	}, []);

	const plantStyle = {
		transform: [{ scale: plantAnim }],
	};

	const glowStyle = {
		opacity: glowAnim.interpolate({
			inputRange: [0, 1],
			outputRange: [0, 0.5],
		}),
		transform: [
			{
				scale: glowAnim.interpolate({
					inputRange: [0, 1],
					outputRange: [0.8, 1.2],
				}),
			},
		],
	};

	const successStyle = {
		transform: [{ scale: scaleAnim }],
		opacity: textAnim,
	};

	return (
		<View style={styles.fullScreenContainer}>
			<View style={styles.container}>
				{/* Glow Effect */}
				<Animated.View
					style={[
						styles.glowContainer,
						glowStyle,
						{ backgroundColor: backgroundAccentColor },
					]}
				/>

				{/* Particles */}
				{particles.map((particle, index) => (
					<Animated.View
						key={`particle-${index}`}
						style={[
							styles.particle,
							{
								transform: [
									{
										translateX: particle.animation.interpolate({
											inputRange: [0, 1],
											outputRange: [0, particle.translateX],
										}),
									},
									{
										translateY: particle.animation.interpolate({
											inputRange: [0, 1],
											outputRange: [0, particle.translateY],
										}),
									},
									{
										scale: particle.animation.interpolate({
											inputRange: [0, 0.3, 1],
											outputRange: [0, particle.scale, 0],
										}),
									},
									{
										rotate: `${particle.rotate}deg`,
									},
								],
								opacity: particle.animation.interpolate({
									inputRange: [0, 0.2, 0.8, 1],
									outputRange: [0, 1, 1, 0],
								}),
							},
						]}
					>
						<Sparkle size={16} color={accentColor} />
					</Animated.View>
				))}

				{/* Droplets */}
				{droplets.map((droplet, index) => (
					<Animated.View
						key={`droplet-${index}`}
						style={[
							styles.dropletContainer,
							{
								transform: [
									{
										translateX: droplet.translateX,
									},
									{
										translateY: droplet.animation.interpolate({
											inputRange: [0, 1],
											outputRange: [-120, 0],
										}),
									},
									{
										scale: droplet.animation.interpolate({
											inputRange: [0, 0.5, 1],
											outputRange: [droplet.scale, droplet.scale, 0],
										}),
									},
								],
								opacity: droplet.animation.interpolate({
									inputRange: [0, 0.8, 1],
									outputRange: [1, 1, 0],
								}),
							},
						]}
					>
						<Droplet size={24} color={accentColor} fill={accentColor} />
					</Animated.View>
				))}

				{/* Plant */}
				<Animated.View style={[styles.plantContainer, plantStyle]}>
					<PlantIllustration size={200} color={accentColor} />
				</Animated.View>

				{/* Success Message */}
				<Animated.View style={[styles.successContainer, successStyle]}>
					<Text style={[styles.successText, { color: accentColor }]}>
						Task Completed!
					</Text>
					<Text style={styles.successSubtext}>
						{isWatering
							? 'Plant watered successfully'
							: 'Plant fertilized successfully'}
					</Text>
				</Animated.View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	fullScreenContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(255, 255, 255, 0.95)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		height: SCREEN_HEIGHT,
		width: SCREEN_WIDTH,
	},
	glowContainer: {
		position: 'absolute',
		width: 300,
		height: 300,
		borderRadius: 150,
		alignSelf: 'center',
		top: SCREEN_HEIGHT * 0.3,
	},
	plantContainer: {
		position: 'absolute',
		alignSelf: 'center',
		top: SCREEN_HEIGHT * 0.3,
	},
	dropletContainer: {
		position: 'absolute',
		alignSelf: 'center',
		top: SCREEN_HEIGHT * 0.3,
	},
	successContainer: {
		position: 'absolute',
		bottom: SCREEN_HEIGHT * 0.3,
		alignItems: 'center',
		width: '100%',
		paddingHorizontal: 20,
	},
	successText: {
		fontSize: 32,
		fontWeight: '700',
		marginBottom: 12,
		textAlign: 'center',
	},
	successSubtext: {
		fontSize: 18,
		color: COLORS.text.secondary.light,
		textAlign: 'center',
	},
	particle: {
		position: 'absolute',
		alignSelf: 'center',
		top: SCREEN_HEIGHT * 0.4,
	},
});
