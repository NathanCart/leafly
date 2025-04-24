import { Text } from '@/components/Text';
import { TourHighlight } from '@/components/Tour/TourHighlight';
import { useTour } from '@/contexts/TourContext';
import { usePlants } from '@/hooks/usePlants';
import { useProfile } from '@/hooks/useProfile';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import {
	CircleAlert as AlertCircle,
	CircleArrowRight,
	Cloud,
	Droplet,
	Leaf,
	Sun,
	Wind,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Animated,
	Dimensions,
	Image,
	Platform,
	Pressable,
	StyleSheet,
	TouchableOpacity,
	useColorScheme,
	View,
} from 'react-native';
import AnimatedLib, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

const getRelativeDate = (date: any) => {
	const now = new Date();
	const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
	if (diffDays === 0) return 'Due today';
	if (diffDays === 1) return 'Due tomorrow';
	if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
	return `Due in ${diffDays} days`;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 220;
const CARD_GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - 12 * 3) / 2.5;

function ScalePressable({ children, style, onPress, ...props }) {
	const scale = useRef(new Animated.Value(1)).current;
	const handlePressIn = () => {
		Animated.spring(scale, {
			toValue: 0.95,
			useNativeDriver: true,
			friction: 5,
			tension: 100,
		}).start();
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	};
	const handlePressOut = () => {
		Animated.spring(scale, {
			toValue: 1,
			useNativeDriver: true,
			friction: 5,
			tension: 100,
		}).start();
	};
	return (
		<Pressable
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			{...props}
		>
			<Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
		</Pressable>
	);
}

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
			<AnimatedLib.View style={[styles.sunRays, rayStyle]}>
				{Array.from({ length: 8 }).map((_, i) => (
					<View
						key={i}
						style={[
							styles.sunRay,
							{ transform: [{ rotate: `${i * 45}deg` }] },
							{ backgroundColor: `${COLORS.warning}B3` },
						]}
					/>
				))}
			</AnimatedLib.View>
			<AnimatedLib.View style={sunStyle}>
				<Sun color={COLORS.warning} size={40} />
			</AnimatedLib.View>
		</View>
	);
};

const CloudShape = ({ style, size = 1, rotation = 0 }) => (
	<View
		style={[
			styles.cloudGroup,
			{ transform: [{ scale: size }, { rotate: `${rotation}deg` }] },
			style,
		]}
	>
		<Cloud color={COLORS.background.light} size={30} style={styles.cloudBase} fill="#fff" />
	</View>
);

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

	const styleAnim = useAnimatedStyle(() => ({
		position: 'absolute',
		top,
		transform: [{ translateX: translateX.value }, { scale: scale.value }],
		opacity: 1,
		zIndex: variant,
	}));

	return (
		<AnimatedLib.View style={styleAnim}>
			<CloudShape size={size} rotation={rotation} />
		</AnimatedLib.View>
	);
};

export default function HomeScreen() {
	const insets = useSafeAreaInsets();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';
	const { currentStep, setCurrentStep, completeTour } = useTour();

	console.log('currentStep', currentStep);

	const [greeting, setGreeting] = useState('');
	const [weather, setWeather] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	const scrollY = useSharedValue(0);
	const { profile } = useProfile();
	const { plants, loading: plantsLoading, scheduleEntries } = usePlants();

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

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayStr = today.toISOString().split('T')[0];

	const upcomingTasks = scheduleEntries?.splice(0, 3);

	const recentlyIdentified = plants
		?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
		.slice(0, 20)
		.map((p) => ({
			id: p.id,
			name: p.nickname,
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

	const handleTourNext = () => {
		if (currentStep === 'add-plant') {
			setCurrentStep('schedule');
		} else if (currentStep === 'schedule') {
			completeTour();
		}
	};

	if (plantsLoading || loading) {
		return (
			<View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={COLORS.primary} />
					<Text style={styles.loadingText}>Loading your garden...</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
			<AnimatedLib.View
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
								color: COLORS.border,
								...COLORS.shadow,
							},
						]}
					>
						{greeting}, {profile?.username ?? 'Plant Lover'}
					</Text>
					{weather ? (
						<View style={styles.weatherInfo}>
							<Text style={styles.temperature}>
								{Math.round(weather.temperature)}°C
							</Text>
							<View style={styles.weatherDetails}>
								<View style={styles.weatherDetail}>
									<Wind color={COLORS.background.light} size={18} />
									<Text style={styles.weatherText}>
										{Math.round(weather.windspeed)} m/s
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
			</AnimatedLib.View>

			<AnimatedLib.ScrollView
				style={styles.scrollView}
				contentContainerStyle={{ paddingTop: HEADER_HEIGHT - 20 }}
				scrollEventThrottle={16}
				onScroll={(e) => {
					scrollY.value = withSequence(
						withTiming(-e.nativeEvent.contentOffset.y * 0.5, { duration: 0 })
					);
				}}
			>
				<AnimatedLib.View
					style={[
						styles.contentCard,
						{
							backgroundColor: isDark ? '#121212' : '#fff',
							transform: [{ translateY: scrollY.value }],
						},
					]}
				>
					{recentlyIdentified.length > 0 && (
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<Text
									style={[
										COLORS.titleMd,
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

							<AnimatedLib.FlatList
								data={recentlyIdentified}
								keyExtractor={(item) => item.id}
								horizontal
								contentContainerStyle={{ paddingHorizontal: 16 }}
								showsHorizontalScrollIndicator={false}
								snapToInterval={CARD_WIDTH + 8}
								decelerationRate="fast"
								ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
								renderItem={({ item, index }) => (
									<ScalePressable
										key={index}
										style={[
											styles.plantCard,
											{
												backgroundColor: isDark ? '#2A3A30' : '#FFFFFF',
												width: CARD_WIDTH,
											},
										]}
										onPress={() =>
											router.push({
												pathname: '/plantDetail',
												params: { id: item.id },
											})
										}
									>
										<View style={styles.imageContainer}>
											<Image
												source={{ uri: item.image }}
												style={{
													width: '100%',
													height: '100%',
													resizeMode: 'cover',
												}}
											/>
											<View style={styles.overlay} />
											<View style={styles.overlayContent}>
												<Text
													style={[styles.plantName, { color: '#FFFFFF' }]}
													numberOfLines={1}
												>
													{item.name}
												</Text>
												<Text
													style={[
														styles.plantSpecies,
														{ color: '#DDDDDD' },
													]}
													numberOfLines={1}
												>
													{item.date}
												</Text>
											</View>
										</View>
									</ScalePressable>
								)}
							/>
						</View>
					)}
					{upcomingTasks.length > 0 && (
						<View style={[styles.section]}>
							<View style={[styles.sectionHeader, { marginBottom: 0 }]}>
								<Text
									style={[
										COLORS.titleMd,
										{
											color: isDark
												? COLORS.text.primary.dark
												: COLORS.text.primary.light,
										},
									]}
								>
									Upcoming Care
								</Text>
							</View>
							<View style={{ paddingHorizontal: 16 }}>
								{upcomingTasks.map((task) => {
									const isWater = task.type === 'Water';
									const accent = isWater ? '#33A1FF' : '#4CAF50';
									const rel = getRelativeDate(task.dueDate);
									const overdue = task.dueDate < today;
									return (
										<ScalePressable
											key={task.id}
											style={{
												flexDirection: 'row',
												alignItems: 'center',
												backgroundColor: '#FFF',
												padding: 12,
												marginBottom: 12,
												borderBottomWidth: 2,
												borderColor: COLORS.border,
											}}
											onPress={() =>
												router.push({
													pathname: '/plantDetail',
													params: { id: task.plantId },
												})
											}
										>
											<View style={COLORS.shadowLg}>
												<Image
													source={{ uri: task?.plantImage ?? '' }}
													style={styles.plantImage}
												/>
											</View>
											<View style={styles.cardContent}>
												<View style={styles.cardHeader}>
													<Text style={styles.cardPlant}>
														{task.plantName}
													</Text>
													<View
														style={[
															styles.cardIcon,
															{ backgroundColor: accent + '10' },
														]}
													>
														{isWater ? (
															<Droplet
																fill={accent}
																color={accent}
																size={16}
															/>
														) : (
															<Leaf
																fill={accent}
																color={accent}
																size={16}
															/>
														)}
													</View>
												</View>
												<View style={styles.cardRow}>
													<Text
														style={[styles.cardType, { color: accent }]}
													>
														{task.type}
													</Text>
													<Text style={[styles.cardDate]}>{rel}</Text>
												</View>
											</View>
										</ScalePressable>
									);
								})}
							</View>
						</View>
					)}
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
				</AnimatedLib.View>
			</AnimatedLib.ScrollView>

			<TourHighlight
				visible={currentStep === 'add-plant'}
				position="bottom"
				title="Welcome to Your Garden!"
				description="Start by adding your first plant. Tap the + button in the tab bar to identify and add a new plant to your collection."
				onNext={handleTourNext}
			/>

			<TourHighlight
				visible={currentStep === 'schedule'}
				position="top"
				title="Care Schedule"
				description="After adding a plant, set up watering and care schedules to keep your plants healthy and thriving."
				onNext={handleTourNext}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	imageContainer: {
		position: 'relative',
		width: '100%',
		height: 160,
		justifyContent: 'flex-end',
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
		borderRadius: 16,
	},
	overlayContent: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		padding: 12,
	},
	plantCard: {
		borderRadius: 20,
		borderWidth: 2,
		borderColor: COLORS.border,
		overflow: 'hidden',
		marginBottom: CARD_GAP,
		...COLORS.shadowLg,
	},
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF',
		padding: 12,
		borderRadius: 12,
		marginBottom: 12,
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.1,
				shadowRadius: 2,
			},
			android: { elevation: 2 },
		}),
	},
	carePlantImage: {
		width: 56,
		height: 56,
		borderRadius: 8,
		marginRight: 12,
	},
	cardContent: {
		flex: 1,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	cardPlant: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111827',
	},
	cardIcon: {
		width: 28,
		height: 28,
		borderRadius: 14,
		justifyContent: 'center',
		alignItems: 'center',
	},
	cardRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	cardType: {
		fontSize: 14,
		fontWeight: '500',
	},
	cardDate: {
		fontSize: 14,
		color: '#6B7280',
	},
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
	weatherContainer: { paddingHorizontal: 16, marginTop: 10 },
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
		backgroundColor: 'transparent',
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
	section: { marginTop: 24 },
	sectionHeader: {
		paddingHorizontal: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
		color: COLORS.title,
	},
	sectionTitle: { fontSize: 20, fontWeight: '700' },
	seeAll: { fontSize: 16, fontWeight: '700' },
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		gap: CARD_GAP,
	},
	plantImage: {
		width: 56,
		height: 56,
		borderRadius: 14,
		marginRight: 12,
	},
	plantCardContent: { padding: 12 },
	plantName: { fontSize: 16, fontWeight: '600' },
	plantSpecies: { fontSize: 12, marginTop: 2 },
	plantCardFooter: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap', gap: 6 },
	healthIndicator: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
	healthText: { fontSize: 10, fontWeight: '500' },
	waterIndicator: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		gap: 4,
	},
	waterText: { fontSize: 10, fontWeight: '500' },
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
