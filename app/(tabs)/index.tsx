import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Dimensions,
	Platform,
	TouchableOpacity,
	useColorScheme,
	ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
	Camera,
	Calendar,
	Sun,
	Cloud,
	CircleAlert as AlertCircle,
	CircleArrowRight,
	Wind,
} from 'lucide-react-native';
import Animated, {
	useAnimatedStyle,
	withRepeat,
	withTiming,
	withSequence,
	withDelay,
	Easing,
	useSharedValue,
} from 'react-native-reanimated';
import * as Location from 'expo-location';
import { PlantCard } from '@/components/PlantCard';
import { RecentPlant } from '@/components/RecentPlant';
import { useMyPlants } from '@/data/plants';
import { useCareSchedules } from '@/data/careSchedule';
import { useProfile } from '@/hooks/useProfile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 220; // Reduced from 280

// Enhanced sun with rays
const AnimatedSun = () => {
	const rotation = useSharedValue(0);
	const scale = useSharedValue(1);
	const rayOpacity = useSharedValue(0.7);

	useEffect(() => {
		rotation.value = withRepeat(
			withTiming(360, { duration: 30000, easing: Easing.linear }),
			-1
		);
		scale.value = withRepeat(
			withSequence(
				withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
				withTiming(0.95, { duration: 2000, easing: Easing.inOut(Easing.ease) })
			),
			-1
		);
		rayOpacity.value = withRepeat(
			withSequence(
				withTiming(0.9, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
				withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) })
			),
			-1
		);
	}, []);

	const sunStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
	}));

	const rayStyle = useAnimatedStyle(() => ({
		opacity: rayOpacity.value,
		transform: [{ rotate: `-${rotation.value * 0.5}deg` }],
	}));

	return (
		<View style={styles.sunContainer}>
			<Animated.View style={[styles.sunRays, rayStyle]}>
				{Array.from({ length: 8 }).map((_, i) => (
					<View
						key={i}
						style={[
							styles.sunRay,
							{ transform: [{ rotate: `${i * 45}deg` }] },
							{ backgroundColor: `${COLORS.warning}B3` }, // 70% alpha
						]}
					/>
				))}
			</Animated.View>
			<Animated.View style={sunStyle}>
				<Sun color={COLORS.warning} size={40} />
			</Animated.View>
		</View>
	);
};

// Cloud shape stays white for both themes
const CloudShape = ({ style, size = 1, rotation = 0 }: any) => (
	<View
		style={[
			styles.cloudGroup,
			{ transform: [{ scale: size }, { rotate: `${rotation}deg` }] },
			style,
		]}
	>
		<Cloud color={COLORS.background.light} size={30} style={styles.cloudBase} />
	</View>
);

// Animated cloud with slower movement and full opacity
const AnimatedCloud = ({
	delay = 0,
	startX = -100,
	top = 60,
	speed = 40000,
	size = 1,
	rotation = 0,
	variant = 0,
}) => {
	const translateX = useSharedValue(startX);
	const translateY = useSharedValue(0);
	const scale = useSharedValue(size);

	useEffect(() => {
		translateX.value = withDelay(
			delay,
			withRepeat(
				withTiming(SCREEN_WIDTH + 150, { duration: speed, easing: Easing.linear }),
				-1
			)
		);
		translateY.value = withDelay(
			delay,
			withRepeat(
				withSequence(
					withTiming(5, { duration: speed / 3, easing: Easing.inOut(Easing.ease) }),
					withTiming(-5, { duration: speed / 3, easing: Easing.inOut(Easing.ease) })
				),
				-1
			)
		);
		scale.value = withDelay(
			delay,
			withRepeat(
				withSequence(
					withTiming(size * 1.05, {
						duration: speed / 4,
						easing: Easing.inOut(Easing.ease),
					}),
					withTiming(size * 0.95, {
						duration: speed / 4,
						easing: Easing.inOut(Easing.ease),
					})
				),
				-1
			)
		);
	}, []);

	const style = useAnimatedStyle(() => ({
		position: 'absolute',
		top,
		transform: [{ translateX: translateX.value }, { scale: scale.value }],
		opacity: 1,
		zIndex: variant,
	}));

	return (
		<Animated.View style={style}>
			<CloudShape size={size} rotation={rotation} />
		</Animated.View>
	);
};

export default function HomeScreen() {
	const insets = useSafeAreaInsets();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';

	const [greeting, setGreeting] = useState('');
	const [weather, setWeather] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	const scrollY = useSharedValue(0);

	const { profile } = useProfile();
	const { myPlants: plants, loading: plantsLoading } = useMyPlants();
	const { careSchedule, loading: scheduleLoading } = useCareSchedules();

	const headerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scrollY.value }] }));

	useEffect(() => {
		const hour = new Date().getHours();
		setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
		fetchWeather();
	}, []);

	const fetchWeather = async () => {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				setLoading(false);
				return;
			}
			const { coords } = await Location.getCurrentPositionAsync({});
			const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true&timezone=auto`;
			const response = await fetch(url);
			if (!response.ok) throw new Error(`Status ${response.status}`);
			const data = await response.json();
			setWeather(data.current_weather || null);
		} catch (error) {
			console.error('Error fetching weather:', error);
		} finally {
			setLoading(false);
		}
	};

	// Build care, recent, alerts…
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayStr = today.toISOString().split('T')[0];
	const upcomingCare = careSchedule
		?.filter((t) => {
			const d = new Date(t.scheduled_date);
			d.setHours(0, 0, 0, 0);
			return d >= today && !t.completed;
		})
		.slice(0, 3)
		.map((task) => {
			const plant = plants.find((p) => p.id === task.plant_id);
			return {
				id: task.id,
				name: plant?.name || 'Unknown',
				action: task.action,
				due: task.scheduled_date === todayStr ? 'Today' : 'Tomorrow',
				image:
					plant?.image_url ||
					'https://images.pexels.com/photos/3097770/pexels-photo-3097770.jpeg',
			};
		});

	const recentlyIdentified = plants
		?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
		.slice(0, 2)
		.map((p) => ({
			id: p.id,
			name: p.name,
			date: new Date(p.created_at).toLocaleDateString('en-US', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
			}),
			image:
				p.image_url || 'https://images.pexels.com/photos/4751978/pexels-photo-4751978.jpeg',
		}));

	const plantHealthAlerts = plants
		?.filter((p) => ['Needs Attention', 'Unhealthy'].includes(p?.health_status || ''))
		.map((p) => ({ id: p.id, plant: p.name, issue: p.health_status }));

	if (plantsLoading || scheduleLoading || loading) {
		return (
			<View
				style={[
					styles.container,
					{ backgroundColor: isDark ? COLORS.background.dark : COLORS.surface.light },
				]}
			>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={COLORS.primary} />
					<Text
						style={[
							styles.loadingText,
							{
								color: isDark
									? COLORS.text.secondary.dark
									: COLORS.text.secondary.light,
							},
						]}
					>
						Loading your garden...
					</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Animated.View
				style={[
					styles.headerContainer,
					{
						backgroundColor: isDark ? COLORS.surface.dark : '#87CEEB',
						paddingTop: insets.top + 32,
					},
					headerStyle,
				]}
			>
				<AnimatedSun />

				{/* Clouds */}
				<AnimatedCloud
					delay={0}
					startX={-150}
					top={30}
					size={1.1}
					speed={40000}
					rotation={5}
					variant={2}
				/>
				<AnimatedCloud
					delay={3000}
					startX={-200}
					top={70}
					size={0.9}
					speed={35000}
					rotation={-8}
					variant={1}
				/>
				<AnimatedCloud
					delay={7000}
					startX={-250}
					top={40}
					size={1.2}
					speed={45000}
					rotation={12}
					variant={3}
				/>
				<AnimatedCloud
					delay={12000}
					startX={-180}
					top={90}
					size={0.8}
					speed={30000}
					rotation={-3}
					variant={0}
				/>

				<View style={styles.weatherContainer}>
					<Text
						style={[
							styles.greeting,

							{
								zIndex: 100,
								color: isDark
									? COLORS.text.primary.dark
									: COLORS.text.primary.light,
							},
						]}
					>
						{greeting}, {'Plant Lover'}
					</Text>
					{weather ? (
						<View style={styles.weatherInfo}>
							<Text style={styles.temperature}>
								{Math.round(weather?.temperature)}°C
							</Text>
							<View style={styles.weatherDetails}>
								<View style={styles.weatherDetail}>
									<Wind color={COLORS.background.light} size={18} />
									<Text style={styles.weatherText}>
										{Math.round(weather?.windspeed)} m/s
									</Text>
								</View>
							</View>
						</View>
					) : (
						<Text
							style={[
								styles.loadingText,
								{
									color: isDark
										? COLORS.text.secondary.dark
										: COLORS.text.secondary.light,
								},
							]}
						>
							Weather unavailable
						</Text>
					)}
				</View>
			</Animated.View>

			<Animated.ScrollView
				style={styles.scrollView}
				contentContainerStyle={{ paddingTop: HEADER_HEIGHT - 20 }}
				scrollEventThrottle={16}
				onScroll={(e) => {
					scrollY.value = withSequence(
						withTiming(-e.nativeEvent.contentOffset.y * 0.5, { duration: 0 })
					);
				}}
			>
				<Animated.View
					style={[
						styles.contentCard,
						{
							backgroundColor: isDark
								? COLORS.background.dark
								: COLORS.background.light,
						},
						{ transform: [{ translateY: scrollY.value }] },
					]}
				>
					{/* Quick Actions
					<View style={styles.quickActions}>
						{[
							{
								icon: <Camera color={COLORS.primary} size={24} />,
								label: 'Identify',
								sub: 'Scan your plants',
								onPress: () => router.push('/identify'),
							},
							{
								icon: <Calendar color={COLORS.primary} size={24} />,
								label: 'Care',
								sub: 'Schedule reminders',
								onPress: () => router.push('/care'),
							},
							{
								icon: <Sun color={COLORS.primary} size={24} />,
								label: 'Light',
								sub: 'Measure light levels',
								onPress: () => router.push('/lightMeter'),
							},
						].map(({ icon, label, sub, onPress }, i) => (
							<TouchableOpacity
								key={i}
								style={[
									styles.actionButton,
									{
										backgroundColor: isDark
											? COLORS.surface.dark
											: COLORS.surface.light,
									},
								]}
								onPress={onPress}
							>
								<View
									style={[
										styles.iconContainer,
										{
											backgroundColor: isDark
												? `${COLORS.primary}1A` // 10% alpha
												: `${COLORS.primary}1A`,
											borderWidth: 1,
											borderColor: isDark
												? `${COLORS.primary}33` // 20% alpha
												: `${COLORS.primary}33`,
										},
									]}
								>
									{icon}
								</View>
								<Text
									style={[
										styles.actionText,
										{
											color: isDark
												? COLORS.text.primary.dark
												: COLORS.text.primary.light,
										},
									]}
								>
									{label}
								</Text>
								<Text
									style={[
										styles.actionSubtext,
										{
											color: isDark
												? COLORS.text.secondary.dark
												: COLORS.text.secondary.light,
										},
									]}
								>
									{sub}
								</Text>
							</TouchableOpacity>
						))}
					</View> */}

					{/* Today's Care */}
					{upcomingCare.length > 0 && (
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<Text
									style={[
										styles.sectionTitle,
										{
											color: isDark
												? COLORS.text.primary.dark
												: COLORS.text.primary.light,
										},
									]}
								>
									Today's Plant Care
								</Text>
								<TouchableOpacity onPress={() => router.push('/care')}>
									<Text
										style={[
											styles.seeAll,
											{ color: isDark ? COLORS.secondary : COLORS.primary },
										]}
									>
										See all
									</Text>
								</TouchableOpacity>
							</View>
							<View style={styles.careCards}>
								{upcomingCare.map((p) => (
									<PlantCard
										key={p.id}
										name={p.name}
										action={p.action}
										due={p.due}
										image={p.image}
										isDark={isDark}
										onPress={() =>
											router.push({
												pathname: '/plantDetail',
												params: { id: p.id },
											})
										}
									/>
								))}
							</View>
						</View>
					)}

					{/* Recently Added */}
					{recentlyIdentified.length > 0 && (
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<Text
									style={[
										styles.sectionTitle,
										{
											color: isDark
												? COLORS.text.primary.dark
												: COLORS.text.primary.light,
										},
									]}
								>
									Recently Added
								</Text>
								<TouchableOpacity onPress={() => router.push('/collection')}>
									<Text
										style={[
											styles.seeAll,
											{ color: isDark ? COLORS.secondary : COLORS.primary },
										]}
									>
										See all
									</Text>
								</TouchableOpacity>
							</View>
							<View style={styles.recentScroll}>
								{recentlyIdentified.map((p) => (
									<RecentPlant
										key={p.id}
										name={p.name}
										date={p.date}
										image={p.image}
										isDark={isDark}
										onPress={() =>
											router.push({
												pathname: '/plantDetail',
												params: { id: p.id },
											})
										}
									/>
								))}
							</View>
						</View>
					)}

					{/* Health Alerts */}
					{plantHealthAlerts.length > 0 && (
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<Text
									style={[
										styles.sectionTitle,
										{
											color: isDark
												? COLORS.text.primary.dark
												: COLORS.text.primary.light,
										},
									]}
								>
									Health Alerts
								</Text>
							</View>
							{plantHealthAlerts.map((a) => (
								<TouchableOpacity
									key={a.id}
									style={[
										styles.alertCard,
										{
											backgroundColor: isDark
												? COLORS.surface.dark
												: `${COLORS.error}33`,
										},
									]}
									onPress={() =>
										router.push({
											pathname: '/plantDiagnosis',
											params: { plantId: a.id, issue: a.issue },
										})
									}
								>
									<AlertCircle color={COLORS.error} size={24} />
									<View style={styles.alertContent}>
										<Text
											style={[
												styles.alertTitle,
												{
													color: isDark
														? COLORS.text.primary.dark
														: COLORS.text.primary.light,
												},
											]}
										>
											{a.plant}: {a.issue}
										</Text>
										<Text
											style={[
												styles.alertSubtitle,
												{
													color: isDark
														? COLORS.text.secondary.dark
														: COLORS.text.secondary.light,
												},
											]}
										>
											Tap to diagnose and treat
										</Text>
									</View>
									<CircleArrowRight
										color={isDark ? COLORS.secondary : COLORS.primary}
										size={24}
									/>
								</TouchableOpacity>
							))}
						</View>
					)}

					<View style={styles.bottomPadding} />
				</Animated.View>
			</Animated.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	headerContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: HEADER_HEIGHT,
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
		overflow: 'hidden',
		zIndex: 0,
	},
	sunContainer: {
		position: 'absolute',
		top: 20,
		right: 20,
		width: 60,
		height: 60,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sunRays: {
		position: 'absolute',
		width: 80,
		height: 80,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sunRay: {
		position: 'absolute',
		width: 60,
		height: 3,
		borderRadius: 2,
		top: 40,
		left: 10,
	},
	cloudGroup: { width: 80, height: 40 },
	cloudBase: { position: 'absolute', top: 0, left: 0, color: 'white' },
	cloudPart1: { position: 'absolute', top: 8, left: 25 },
	cloudPart2: { position: 'absolute', top: 0, left: 50 },
	weatherContainer: { paddingHorizontal: 20, marginTop: 10 },
	greeting: { fontSize: 24, fontWeight: '700', marginBottom: 10 },
	weatherInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: 'rgba(255,255,255,0.2)',
		borderRadius: 16,
		padding: 12,
	},
	temperature: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
	weatherDetails: { flexDirection: 'row', gap: 10 },
	weatherDetail: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	weatherText: { fontSize: 16, fontWeight: '500', color: '#FFFFFF' },
	scrollView: { flex: 1, zIndex: 1 },
	contentCard: {
		marginTop: -20,
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
		paddingTop: 20,
		minHeight: SCREEN_HEIGHT,
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: -3 },
				shadowOpacity: 0.1,
				shadowRadius: 4,
			},
			android: { elevation: 4 },
		}),
	},
	quickActions: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 8,
		marginHorizontal: 16,
		borderRadius: 16,
		paddingVertical: 8,
	},
	actionButton: {
		alignItems: 'flex-start',
		padding: 16,
		borderRadius: 16,
		width: '31%',
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.1,
				shadowRadius: 3,
			},
			android: { elevation: 2 },
		}),
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 12,
	},
	actionText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
	actionSubtext: { fontSize: 12, fontWeight: '400' },
	section: { marginTop: 24, paddingHorizontal: 16 },
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	sectionTitle: { fontSize: 18, fontWeight: '600' },
	seeAll: { fontSize: 14, fontWeight: '500' },
	careCards: { gap: 12 },
	recentScroll: { flexDirection: 'row', gap: 12 },
	alertCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		marginBottom: 10,
	},
	alertContent: { flex: 1, marginLeft: 12 },
	alertTitle: { fontSize: 16, fontWeight: '500' },
	alertSubtitle: { fontSize: 14, marginTop: 2 },
	bottomPadding: { height: 40 },
	loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	loadingText: { marginTop: 16, fontSize: 16 },
});
