/* ------------------------------------------------------------------
   AddPlantStepperModal.tsx  –  full, drop-in component
   ------------------------------------------------------------------ */

import { COLORS } from '@/app/constants/colors';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { PlantIdSuggestionRaw } from '@/types/plants';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
	Animated,
	Easing,
	Image,
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';

/* ------------- vector icons ------------- */
import { Dice6, Image as ImageIcon, Leaf, X, ArrowLeft, CalendarDays } from 'lucide-react-native';
import Svg, { Path, Rect, Circle, Polygon } from 'react-native-svg';
import { adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { SuccessAnimation } from './SuccessAnimation';

/* ---------- tiny SVG sprites ---------- */
type PotSvgProps = { size?: number };

const PotSvg = ({ size = 120 }: PotSvgProps) => (
	<Svg width={size} height={size} viewBox="0 0 64 64">
		<Path d="M16 40h32l-3 16H19L16 40Z" fill="#8d5524" />
		<Path d="M24 40V26a8 8 0 1 1 16 0v14" fill="#71c285" />
		<Circle cx="32" cy="24" r="3" fill="#57a773" />
	</Svg>
);
const SoilFast = () => (
	<Svg width={48} height={48} viewBox="0 0 64 64">
		<Rect x="12" y="34" width="40" height="14" rx="3" fill="#8d5524" />
		<Path d="M12 34h40l-4-10H16l-4 10z" fill="#b87333" />
	</Svg>
);
const SoilStandard = () => (
	<Svg width={48} height={48} viewBox="0 0 64 64">
		<Rect x="12" y="30" width="40" height="18" rx="3" fill="#6B4423" />
		<Path d="M12 30h40l-4-8H16l-4 8z" fill="#8d5524" />
	</Svg>
);
const SoilMoist = () => (
	<Svg width={48} height={48} viewBox="0 0 64 64">
		<Rect x="12" y="26" width="40" height="22" rx="3" fill="#4e342e" />
		<Path d="M12 26h40l-4-6H16l-4 6z" fill="#6B4423" />
		<Circle cx="24" cy="37" r="3" fill="#03a9f4" />
		<Circle cx="40" cy="41" r="2" fill="#03a9f4" />
	</Svg>
);
const HouseSvg = () => (
	<Svg width={32} height={32} viewBox="0 0 64 64">
		<Path d="M12 28L32 12l20 16v20H12V28Z" fill="#6c757d" />
		<Rect x="22" y="32" width="8" height="8" fill="#fff" />
	</Svg>
);
const TreesSvg = () => (
	<Svg width={32} height={32} viewBox="0 0 64 64">
		<Path d="M6 52h52v4H6z" fill="#6c757d" />
		<Polygon points="32 12 12 52 52 52" fill="#71c285" />
	</Svg>
);
const Sun = (r: number, extra: React.ReactNode = null) => (
	<Svg width={32} height={32} viewBox="0 0 64 64">
		<Circle cx="32" cy="32" r={r} fill="#ffc107" />
		{extra}
	</Svg>
);
const LightIcons = {
	low: Sun(8),
	medium: Sun(10),
	bright: Sun(12),
	full: Sun(
		14,
		<Path
			d="M32 2v8M32 54v8M2 32h8M54 32h8M11 11l6 6M47 47l6 6M11 53l6-6M47 17l6-6"
			stroke="#ffc107"
			strokeWidth={4}
			strokeLinecap="round"
		/>
	),
};

/* ---------- step configs ---------- */
const LIGHT_LEVELS = [
	{ key: 'low', label: 'Low', desc: 'Minimal direct light' },
	{ key: 'medium', label: 'Medium', desc: 'Bright indirect light' },
	{ key: 'bright', label: 'Bright', desc: '3-5 h direct light' },
	{ key: 'full', label: 'Full Sun', desc: '6 h+ direct light' },
] as const;
type LightKey = (typeof LIGHT_LEVELS)[number]['key'];

type SoilKey = 'fast' | 'standard' | 'moist';
const SOILS: Record<SoilKey, { label: string; desc: string; Svg: () => JSX.Element }> = {
	fast: { label: 'Fast-draining', desc: 'Cactus / succulent', Svg: SoilFast },
	standard: { label: 'Standard', desc: 'All-purpose mix', Svg: SoilStandard },
	moist: { label: 'Moist-retentive', desc: 'High peat / coco', Svg: SoilMoist },
};

const ENV = [
	{ key: 'indoor', label: 'Indoors', desc: 'Climate-controlled', Svg: HouseSvg },
	{ key: 'outdoor', label: 'Outdoors', desc: 'Exposed to weather', Svg: TreesSvg },
] as const;
type EnvKey = (typeof ENV)[number]['key'];

/* ---------- props ---------- */
interface Props {
	visible: boolean;
	onClose: () => void;
	plant: PlantIdSuggestionRaw;
	onConfirm: (
		customImage: boolean,
		nickname: string,
		imageUri: string | undefined,
		lastWatered: Date,
		location: 'indoor' | 'outdoor',
		soilType: string,
		potDiameter: string,
		lightAmount: string
	) => Promise<void>;
	isDark: boolean;
}

/* ===================================================================== */
export function AddPlantStepperModal({ visible, onClose, plant, onConfirm, isDark }: Props) {
	/* ------------ state ------------ */
	const [nickname, setNickname] = useState('');
	const [customImage, setCustomImage] = useState<string | null>(null);
	const [hasError, setHasError] = useState(false);

	const [light, setLight] = useState<LightKey>('medium');
	const [potDiameter, setPotDiameter] = useState(8);
	const [soil, setSoil] = useState<SoilKey>('standard');
	const [environment, setEnvironment] = useState<EnvKey>('indoor');

	const [lastWatered, setLastWatered] = useState<Date>(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);

	const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
	const [showSuccess, setShowSuccess] = useState(false);

	/* ------------ animations ------------ */
	const spinVal = useRef(new Animated.Value(0)).current;
	const scaleVal = useRef(new Animated.Value(1)).current;
	const shakeVal = useRef(new Animated.Value(0)).current;
	const spinningRef = useRef(false);
	const hapticInterval = useRef<NodeJS.Timeout | null>(null);

	const currentImage = customImage ?? plant.capturedImageUri;

	/* ------------ haptic helpers ------------ */
	const lightBump = () =>
		Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	const heavyBump = () =>
		Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
	const errorBump = () =>
		Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

	/* ------------ dice press ------------ */
	const rollDice = () => {
		spinningRef.current = true;
		lightBump();

		/* spam-haptics while spinning */
		if (hapticInterval.current) clearInterval(hapticInterval.current);
		hapticInterval.current = setInterval(() => {
			if (spinningRef.current) lightBump();
		}, 100);

		Animated.timing(spinVal, {
			toValue: 4,
			duration: 800,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}).start(() => {
			spinVal.setValue(0);
			spinningRef.current = false;
			hapticInterval.current && clearInterval(hapticInterval.current);
			heavyBump();
		});

		Animated.sequence([
			Animated.timing(scaleVal, {
				toValue: 1.05,
				duration: 100,
				easing: Easing.bounce,
				useNativeDriver: true,
			}),
			Animated.timing(scaleVal, {
				toValue: 1,
				duration: 100,
				easing: Easing.bounce,
				useNativeDriver: true,
			}),
		]).start();

		setNickname(
			uniqueNamesGenerator({
				dictionaries: [adjectives, colors, animals],
				length: 2,
				separator: ' ',
				style: 'capital',
			})
		);
		setHasError(false);
	};

	/* ------------ image picker ------------ */
	const pickImage = async () => {
		const res = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.6,
		});
		if (!res.canceled && res.assets[0]?.uri) {
			setCustomImage(res.assets[0].uri);
			lightBump();
		}
	};

	/* ------------ validation ------------ */
	const validateName = () => {
		if (nickname.trim()) return true;
		setHasError(true);
		errorBump();
		Animated.sequence([
			Animated.timing(shakeVal, {
				toValue: 10,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(shakeVal, {
				toValue: -10,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(shakeVal, {
				toValue: 10,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(shakeVal, {
				toValue: 0,
				duration: 100,
				useNativeDriver: true,
			}),
		]).start();
		return false;
	};

	/* ------------ navigation ------------ */
	const next = () => {
		lightBump();
		if (step === 0 && !validateName()) return;

		if (step < 5) setStep((s) => (s + 1) as any);
		else {
			setShowSuccess(true);
			onConfirm(
				!!customImage,
				nickname.trim(),
				currentImage,
				lastWatered,
				environment,
				soil,
				potDiameter.toString(),
				light
			).catch(console.error);
		}
	};
	const back = () => {
		lightBump();
		if (step === 0) onClose();
		else setStep((s) => (s - 1) as any);
	};
	const done = () => {
		setShowSuccess(false);
		onClose();
		router.push('/(tabs)/collection');
	};

	/* ------------ dots ------------ */
	const Dots = () => (
		<View style={styles.dotRow}>
			{Array.from({ length: 5 }).map((_, i) => (
				<View
					key={i}
					style={[
						styles.dot,
						{
							backgroundColor:
								step === 0 ? '#D9D9D9' : i < step ? COLORS.primary : '#D9D9D9',
						},
					]}
				/>
			))}
		</View>
	);

	/* ------------ step 0: naming ------------ */
	const NamingStep = () => (
		<ScrollView keyboardDismissMode="on-drag" contentContainerStyle={{ flexGrow: 1 }}>
			<View style={styles.content}>
				{/* ---- avatar ---- */}
				<TouchableOpacity style={styles.imgWrap} onPress={pickImage}>
					<Image source={{ uri: currentImage }} style={styles.avatar} />
					<View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
						<ImageIcon color="#fff" size={24} />
						<Text style={styles.overlayText}>Change Photo</Text>
					</View>
					<View
						style={[
							styles.editBadge,
							{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
						]}
					>
						<ImageIcon color={COLORS.primary} size={20} />
					</View>
					<View
						style={[
							styles.plantBadge,
							{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
						]}
					>
						<Leaf color={COLORS.primary} size={20} />
						<Text
							style={[
								styles.plantBadgeText,
								{ color: isDark ? '#E0E0E0' : '#283618' },
							]}
						>
							{plant.name}
						</Text>
					</View>
				</TouchableOpacity>

				{/* ---- title ---- */}
				<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
					Name Your Plant
				</Text>
				<Text style={[styles.subtitle, { color: isDark ? '#BBB' : '#555' }]}>
					Give your new plant friend a unique name
				</Text>

				{/* ---- input row ---- */}
				<View style={styles.nameRow}>
					<Animated.View
						style={[
							styles.inputWrap,
							{
								transform: [{ scale: scaleVal }, { translateX: shakeVal }],
								borderWidth: hasError ? 0 : 2,
							},
						]}
					>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: hasError
										? isDark
											? '#3A2A2A'
											: '#FFE8E0'
										: isDark
										? '#1f1f1f'
										: '#fff',
									color: isDark ? '#E0E0E0' : '#283618',
									borderColor: hasError ? '#D27D4C' : 'transparent',
									borderWidth: hasError ? 1 : 0,
								},
							]}
							placeholder="Give me a name"
							placeholderTextColor={hasError ? '#D27D4C' : isDark ? '#777' : '#AAA'}
							value={nickname}
							onChangeText={(t) => {
								setNickname(t);
								if (t.trim()) setHasError(false);
							}}
						/>
					</Animated.View>

					<TouchableOpacity
						style={[
							styles.diceBtn,
							{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
						]}
						onPress={rollDice}
					>
						<Animated.View
							style={{
								transform: [
									{
										rotate: spinVal.interpolate({
											inputRange: [0, 4],
											outputRange: ['0deg', '1440deg'],
										}),
									},
								],
							}}
						>
							<Dice6 size={24} color={COLORS.primary} />
						</Animated.View>
					</TouchableOpacity>
				</View>
				{hasError && (
					<Text
						style={[
							styles.errorText,
							{ color: '#D27D4C', textAlign: 'left', alignSelf: 'flex-start' },
						]}
					>
						Please give your plant a name
					</Text>
				)}
			</View>
		</ScrollView>
	);

	/* ------------ step 1: light ------------ */
	const LightStep = () => (
		<View style={styles.content}>
			<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
				How much light does it get?
			</Text>
			<View style={{ height: 16 }} />
			{LIGHT_LEVELS.map(({ key, label, desc }) => {
				const selected = light === key;
				return (
					<TouchableOpacity
						key={key}
						style={[
							styles.card,
							{
								backgroundColor: selected
									? COLORS.primary
									: isDark
									? '#1E1E1E'
									: '#F7F7F7',
							},
						]}
						onPress={() => {
							setLight(key);
							lightBump();
						}}
					>
						{LightIcons[key]}
						<View style={{ marginLeft: 16, flex: 1 }}>
							<Text
								style={[
									styles.cardTitle,
									{
										color: selected
											? '#FFFFFF'
											: isDark
											? '#E0E0E0'
											: '#283618',
									},
								]}
							>
								{label}
							</Text>
							<Text
								style={[
									styles.cardDesc,
									{ color: selected ? '#FFF' : isDark ? '#AAA' : '#666' },
								]}
							>
								{desc}
							</Text>
						</View>
					</TouchableOpacity>
				);
			})}
		</View>
	);

	/* ------------ step 2: pot ------------ */
	// (identical to original)
	const PotStep = () => {
		const [localDiam, setLocalDiam] = useState(potDiameter);
		const isFirstSync = useRef(true);

		useEffect(() => {
			if (isFirstSync.current) {
				isFirstSync.current = false;
				return;
			}
			setLocalDiam(potDiameter);
		}, [potDiameter]);
		const fadeVal = useRef(new Animated.Value(-1)).current;

		useEffect(() => {
			// fade the slider in as soon as the component mounts

			Animated.timing(fadeVal, {
				toValue: 1,
				duration: 400,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			}).start();
		}, []);

		return (
			<View style={styles.content}>
				<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
					What is the pot diameter?
				</Text>

				<PotSvg size={200} />

				<Text style={styles.potVal}>
					{localDiam.toFixed(1)}
					<Text style={{ fontSize: 20 }}> in</Text>
				</Text>

				<Animated.View style={{ width: '100%', opacity: fadeVal }}>
					<Slider
						style={{ width: '100%', marginTop: 24 }}
						minimumValue={2}
						maximumValue={24}
						step={0.5}
						value={localDiam}
						onValueChange={(v) => setLocalDiam(v)}
						onSlidingComplete={(v) => {
							setPotDiameter(v);
							lightBump();
						}}
						thumbTintColor={COLORS.primary}
						minimumTrackTintColor={COLORS.primary}
						maximumTrackTintColor={isDark ? '#444' : '#CCC'}
					/>
				</Animated.View>
			</View>
		);
	};

	/* ------------ step 3: soil ------------ */
	const SoilStep = () => (
		<View style={styles.content}>
			<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
				Which soil do you use?
			</Text>
			{Object.entries(SOILS).map(([key, { label, desc, Svg }]) => {
				const selected = soil === key;
				return (
					<TouchableOpacity
						key={key}
						style={[
							styles.soilRow,
							{
								backgroundColor: selected
									? COLORS.primary
									: isDark
									? '#1E1E1E'
									: '#F7F7F7',
							},
						]}
						onPress={() => {
							setSoil(key as SoilKey);
							lightBump();
						}}
					>
						<Svg />
						<View style={{ marginLeft: 16, flex: 1 }}>
							<Text
								style={[
									styles.cardTitle,
									{
										color: selected ? '#FFF' : isDark ? '#E0E0E0' : '#283618',
									},
								]}
							>
								{label}
							</Text>
							<Text
								style={[
									styles.cardDesc,
									{ color: selected ? '#FFF' : isDark ? '#AAA' : '#666' },
								]}
							>
								{desc}
							</Text>
						</View>
					</TouchableOpacity>
				);
			})}
		</View>
	);

	/* ------------ step 4: environment ------------ */
	const LocationStep = () => (
		<View style={styles.content}>
			<Text
				style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618', marginBottom: 24 }]}
			>
				Where will it live?
			</Text>
			{ENV.map(({ key, label, desc, Svg }) => {
				const selected = environment === key;
				return (
					<TouchableOpacity
						key={key}
						style={[
							styles.card,
							{
								backgroundColor: selected
									? COLORS.primary
									: isDark
									? '#1E1E1E'
									: '#F7F7F7',
							},
						]}
						onPress={() => {
							setEnvironment(key as EnvKey);
							lightBump();
						}}
					>
						<Svg />
						<View style={{ marginLeft: 16, flex: 1 }}>
							<Text
								style={[
									styles.cardTitle,
									{
										color: selected ? '#FFF' : isDark ? '#E0E0E0' : '#283618',
									},
								]}
							>
								{label}
							</Text>
							<Text
								style={[
									styles.cardDesc,
									{ color: selected ? '#FFF' : isDark ? '#AAA' : '#666' },
								]}
							>
								{desc}
							</Text>
						</View>
					</TouchableOpacity>
				);
			})}
		</View>
	);

	/* ------------ step 5: last watered ------------ */
	const LastWateredStep = () => (
		<View style={styles.content}>
			<Text
				style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618', marginBottom: 8 }]}
			>
				When was it last watered?
			</Text>

			<TouchableOpacity
				style={[styles.dateBtn, { backgroundColor: isDark ? '#1E1E1E' : '#F7F7F7' }]}
				onPress={() => {
					setShowDatePicker(true);
					lightBump();
				}}
			>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
					<CalendarDays size={20} color={COLORS.primary} />
					<Text style={[styles.dateBtnText, { color: isDark ? '#E0E0E0' : '#283618' }]}>
						{lastWatered.toLocaleDateString()}
					</Text>
				</View>
			</TouchableOpacity>

			{showDatePicker && (
				<DateTimePicker
					value={lastWatered}
					mode="date"
					maximumDate={new Date()}
					display={Platform.OS === 'ios' ? 'spinner' : 'default'}
					onChange={(evt, date) => {
						if (Platform.OS !== 'ios') setShowDatePicker(false);
						if (date) {
							setLastWatered(date);
							lightBump();
						}
					}}
				/>
			)}
		</View>
	);

	/* ------------ render ------------ */
	return (
		<Modal visible={visible} animationType="fade" onRequestClose={onClose}>
			<KeyboardAvoidingView
				style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				{showSuccess && <SuccessAnimation onAnimationComplete={done} />}

				{/* nav row */}
				<View style={[styles.navRow, { top: Platform.OS === 'ios' ? 50 : 20 }]}>
					<TouchableOpacity style={styles.navBtn} onPress={back}>
						{step === 0 ? (
							<X size={20} color="#fff" />
						) : (
							<ArrowLeft size={20} color="#fff" />
						)}
					</TouchableOpacity>
					<Dots />
					<View style={{ width: 40 }} />
				</View>

				{
					[
						<NamingStep key={0} />,
						<LightStep key={1} />,
						<PotStep key={2} />,
						<SoilStep key={3} />,
						<LocationStep key={4} />,
						<LastWateredStep key={5} />,
					][step]
				}

				<View style={styles.cta}>
					<Button onPress={next} fullWidth size="large">
						{step < 5 ? 'Next' : 'Add Plant'}
					</Button>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

/* ---------- styles (unchanged + 2 new) ---------- */
const styles = StyleSheet.create({
	container: { flex: 1 },

	navRow: {
		position: 'absolute',
		left: 20,
		right: 20,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		zIndex: 10,
	},
	navBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},

	dotRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	dot: { width: 10, height: 10, borderRadius: 5 },

	content: {
		flex: 1,
		paddingTop: Platform.OS === 'ios' ? 100 : 70,
		paddingHorizontal: 20,
		alignItems: 'center',
	},

	/* avatar block */
	imgWrap: { position: 'relative', marginBottom: 32, ...COLORS.shadowLg },
	avatar: {
		width: 180,
		height: 180,
		borderRadius: 24,
		borderWidth: 2,
		borderColor: COLORS.border,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
		opacity: 0,
	},
	overlayText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 8 },

	editBadge: {
		position: 'absolute',
		top: 10,
		right: 10,
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: 'center',
		alignItems: 'center',
		...COLORS.shadow,
	},
	plantBadge: {
		position: 'absolute',
		bottom: -20,
		left: '50%',
		transform: [{ translateX: -80 }],
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		gap: 8,
		width: 160,
	},
	plantBadgeText: { fontSize: 14, fontWeight: '600' },

	/* text */
	title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
	subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24 },

	/* naming input */
	nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	inputWrap: { flex: 1, borderRadius: 16, borderColor: COLORS.border },
	input: { height: 56, borderRadius: 16, paddingHorizontal: 16, fontSize: 16 },
	errorText: { fontSize: 12, marginTop: 4, marginLeft: 4 },
	diceBtn: {
		width: 56,
		height: 56,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},

	/* cards */
	card: {
		width: '100%',
		borderRadius: 16,
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
		borderColor: COLORS.border,
		marginBottom: 12,
		...COLORS.shadow,
	},
	cardTitle: { fontSize: 16, fontWeight: '600' },
	cardDesc: { fontSize: 13, marginTop: 4 },

	potVal: {
		fontSize: 44,
		fontWeight: '700',
		textAlign: 'center',
		marginVertical: 16,
	},

	soilRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 16,
		padding: 16,
		borderColor: COLORS.border,
		width: '100%',
		marginTop: 16,
		...COLORS.shadow,
	},

	cta: {
		position: 'absolute',
		bottom: Platform.OS === 'ios' ? 20 : 20,
		left: 20,
		right: 20,
	},

	/* NEW styles for last-watered step */
	dateBtn: {
		width: '100%',
		borderRadius: 16,
		paddingVertical: 16,
		alignItems: 'center',
		marginTop: 16,
		...COLORS.shadow,
	},
	dateBtnText: { fontSize: 18, fontWeight: '600' },
});
