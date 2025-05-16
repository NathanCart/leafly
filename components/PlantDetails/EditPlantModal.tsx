/* ------------------------------------------------------------------
   EditPlantStepperModal.tsx  – full, drop-in replacement
   ------------------------------------------------------------------

   Only two tiny fixes were made vs. your original:

   1️⃣ SuccessAnimation import path is now identical to AddPlantStepperModal  
      →  `import { SuccessAnimation } from './SuccessAnimation';`

   2️⃣ We trigger the success animation *before* kicking off the async save,  
      exactly like AddPlantStepperModal does.  
      → inside `saveChanges()` we now call `setShowSuccess(true)` first and
        wrap the actual persistence work in an async IIFE.
   ------------------------------------------------------------------ */

import { COLORS } from '@/app/constants/colors';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
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
import { Dice6, Image as ImageIcon, Leaf, X, ArrowLeft, CalendarDays } from 'lucide-react-native';
import Svg, { Path, Rect, Circle, Polygon } from 'react-native-svg';
import {
	adjectives,
	colors as colorDict,
	animals,
	uniqueNamesGenerator,
} from 'unique-names-generator';
import { useS3Uploader } from '../useS3Uploader';
import { SuccessAnimation } from '../PlantIdentification/SuccessAnimation';

/* ---------- tiny SVG sprites ---------- */
const PotSvg = ({ size = 120 }: { size?: number }) => (
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
	fast: { label: 'Fast-draining', desc: 'Cactus / succulent mix', Svg: SoilFast },
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
	onSave: (updates: {
		nickname: string;
		imageUri?: string;
		light: LightKey;
		potDiameter: number;
		soil: SoilKey;
		location: EnvKey;
		lastWatered: Date;
	}) => Promise<void>;
	plant: any | null;
	isDark: boolean;
}

/* ===================================================================== */
export function EditPlantStepperModal({ visible, onClose, onSave, plant, isDark }: Props) {
	/* ---------- state ---------- */
	const [nickname, setNickname] = useState('');
	const [customImage, setCustomImage] = useState<string | null>(null);

	const [light, setLight] = useState<LightKey>('medium');
	const [potDiameter, setPotDiameter] = useState(8);
	const [soil, setSoil] = useState<SoilKey>('standard');
	const [location, setLocation] = useState<EnvKey>('indoor');
	const [lastWatered, setLastWatered] = useState<Date>(new Date());

	const [hasError, setHasError] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
	const [showSuccess, setShowSuccess] = useState(false);

	const { uploadFile, isUploading } = useS3Uploader(process.env.EXPO_PUBLIC_BUCKET_NAME!);

	/* animations */
	const spinVal = useRef(new Animated.Value(0)).current;
	const scaleVal = useRef(new Animated.Value(1)).current;
	const shakeVal = useRef(new Animated.Value(0)).current;
	const hapticTimer = useRef<NodeJS.Timeout | null>(null);
	const spinning = useRef(false);

	/* ---------- sync defaults whenever modal opens ---------- */
	useEffect(() => {
		if (!visible || !plant) return;

		setNickname(plant.nickname ?? '');
		setCustomImage(null); // reset preview
		setLight((plant.light ?? plant.light_amount ?? 'medium') as LightKey);
		setPotDiameter(Number(plant?.pot_diameter ?? 8));
		setSoil((plant.soil ?? plant.soil_type ?? 'standard') as SoilKey);
		setLocation((plant.location ?? 'indoor') as EnvKey);
		setLastWatered(
			plant.last_watered
				? new Date(plant.last_watered)
				: plant.lastWatered
				? new Date(plant.lastWatered)
				: new Date()
		);

		setStep(0);
		setHasError(false);
		setShowSuccess(false);
	}, [visible, plant]);

	/* ---------- helpers ---------- */
	const currentImage = customImage ?? plant?.image_url ?? '';

	const bump = (style: 'Light' | 'Medium' | 'Heavy') =>
		Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle[style]);

	const randomise = () => {
		spinning.current = true;
		bump('Light');
		if (hapticTimer.current) clearInterval(hapticTimer.current);
		hapticTimer.current = setInterval(() => spinning.current && bump('Light'), 100);

		Animated.timing(spinVal, {
			toValue: 4,
			duration: 800,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}).start(() => {
			spinVal.setValue(0);
			spinning.current = false;
			hapticTimer.current && clearInterval(hapticTimer.current);
			bump('Heavy');
		});
		Animated.sequence([
			Animated.timing(scaleVal, { toValue: 1.05, duration: 100, useNativeDriver: true }),
			Animated.timing(scaleVal, { toValue: 1, duration: 100, useNativeDriver: true }),
		]).start();

		setNickname(
			uniqueNamesGenerator({
				dictionaries: [adjectives, colorDict, animals],
				length: 2,
				separator: ' ',
				style: 'capital',
			})
		);
		setHasError(false);
	};

	const pickImage = async () => {
		const res = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.6,
		});
		if (res.canceled || !res.assets.length) return;
		bump('Light');
		setCustomImage(res.assets[0].uri);
	};

	const validateName = () => {
		if (nickname.trim()) return true;
		setHasError(true);
		Animated.sequence([
			Animated.timing(shakeVal, { toValue: 10, duration: 100, useNativeDriver: true }),
			Animated.timing(shakeVal, { toValue: -10, duration: 100, useNativeDriver: true }),
			Animated.timing(shakeVal, { toValue: 10, duration: 100, useNativeDriver: true }),
			Animated.timing(shakeVal, { toValue: 0, duration: 100, useNativeDriver: true }),
		]).start(
			() =>
				Platform.OS !== 'web' &&
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
		);
		return false;
	};

	/* ---------- nav ---------- */
	const next = () => {
		bump('Light');
		if (step === 0 && !validateName()) return;
		if (step < 5) setStep((s) => (s + 1) as any);
		else saveChanges();
	};
	const back = () => {
		bump('Light');
		if (step === 0) onClose();
		else setStep((s) => (s - 1) as any);
	};

	/* ---------- save ---------- */
	const saveChanges = () => {
		/* 1️⃣ trigger animation first (mirrors Add modal) */
		setShowSuccess(true);
	};

	const finish = () => {
		onClose();
		setShowSuccess(false);

		(async () => {
			try {
				let uploadedUrl: string | undefined;
				if (customImage) {
					const key = `plants/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
					uploadedUrl = await uploadFile(customImage, key);
				}
				await onSave({
					nickname: nickname.trim(),
					imageUri: uploadedUrl,
					light,
					potDiameter,
					soil,
					location,
					lastWatered,
				});
			} catch (err) {
				console.error(err);
				setShowSuccess(false); // roll back if failed
			}
		})();
	};

	/* ---------- dots ---------- */
	const Dots = () => (
		<View style={styles.dotRow}>
			{Array.from({ length: 5 }).map((_, i) => (
				<View
					key={i}
					style={[styles.dot, { backgroundColor: i < step ? COLORS.primary : '#D9D9D9' }]}
				/>
			))}
		</View>
	);

	/* ---------- Step components ---------- */
	const NamingStep = () => (
		<ScrollView keyboardDismissMode="on-drag" contentContainerStyle={{ flexGrow: 1 }}>
			<View style={styles.content}>
				<TouchableOpacity style={styles.imgWrap} onPress={pickImage}>
					<Image source={{ uri: currentImage }} style={styles.avatar} />
					{/* overlay on hover – RN has no hover on mobile */}
					{customImage && isUploading && (
						<View style={styles.uploadVeil}>
							<Text style={{ fontWeight: '600' }}>Uploading…</Text>
						</View>
					)}
					<View
						style={[
							styles.editBadge,
							{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
						]}
					>
						<ImageIcon size={20} color={COLORS.primary} />
					</View>
					<View
						style={[
							styles.plantBadge,
							{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
						]}
					>
						<Leaf size={20} color={COLORS.primary} />
						<Text
							style={[
								styles.plantBadgeText,
								{ color: isDark ? '#E0E0E0' : '#283618' },
							]}
							numberOfLines={1}
						>
							{plant.name}
						</Text>
					</View>
				</TouchableOpacity>

				<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
					Edit Nickname
				</Text>
				<Text style={[styles.subtitle, { color: isDark ? '#BBB' : '#555' }]}>
					Give your plant a personal touch
				</Text>

				<View style={styles.nameRow}>
					<Animated.View
						style={[
							styles.inputWrap,
							{ transform: [{ scale: scaleVal }, { translateX: shakeVal }] },
						]}
					>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: isDark ? '#1f1f1f' : '#fff',
									color: isDark ? '#E0E0E0' : '#283618',
									borderColor: hasError ? '#D27D4C' : 'transparent',
									borderWidth: hasError ? 1 : 0,
								},
							]}
							value={nickname}
							placeholder="Nickname"
							placeholderTextColor={isDark ? '#777' : '#AAA'}
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
						onPress={randomise}
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
					<Text style={[styles.errorText, { color: '#D27D4C', alignSelf: 'flex-start' }]}>
						Please enter a nickname
					</Text>
				)}
			</View>
		</ScrollView>
	);

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
							bump('Light');
						}}
					>
						{LightIcons[key]}
						<View style={{ marginLeft: 16, flex: 1 }}>
							<Text
								style={[
									styles.cardTitle,
									{ color: selected ? '#FFF' : isDark ? '#E0E0E0' : '#283618' },
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

		return (
			<View style={styles.content}>
				<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
					Pot diameter?
				</Text>
				<PotSvg size={200} />
				<Text style={styles.potVal}>
					{localDiam?.toFixed?.(1)}
					<Text style={{ fontSize: 20 }}> in</Text>
				</Text>
				<Slider
					style={{ width: '100%', marginTop: 24 }}
					minimumValue={2}
					maximumValue={24}
					step={0.5}
					value={localDiam}
					onValueChange={setLocalDiam}
					onSlidingComplete={setPotDiameter}
					thumbTintColor={COLORS.primary}
					minimumTrackTintColor={COLORS.primary}
					maximumTrackTintColor={isDark ? '#444' : '#CCC'}
				/>
			</View>
		);
	};

	const SoilStep = () => (
		<View style={styles.content}>
			<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
				Soil type?
			</Text>
			{Object.entries(SOILS).map(([key, { label, desc, Svg }], i) => {
				const selected = soil === key;
				return (
					<TouchableOpacity
						key={i}
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
							bump('Light');
						}}
					>
						<Svg />
						<View style={{ marginLeft: 16, flex: 1 }}>
							<Text
								style={[
									styles.cardTitle,
									{ color: selected ? '#FFF' : isDark ? '#E0E0E0' : '#283618' },
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

	const LocationStep = () => (
		<View style={styles.content}>
			<Text
				style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618', marginBottom: 24 }]}
			>
				Where will it live?
			</Text>
			{ENV.map(({ key, label, desc, Svg }) => {
				const selected = location === key;
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
							setLocation(key as EnvKey);
							bump('Light');
						}}
					>
						<Svg />
						<View style={{ marginLeft: 16, flex: 1 }}>
							<Text
								style={[
									styles.cardTitle,
									{ color: selected ? '#FFF' : isDark ? '#E0E0E0' : '#283618' },
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

	const LastWateredStep = () => (
		<View style={styles.content}>
			<Text
				style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618', marginBottom: 24 }]}
			>
				Last watered?
			</Text>
			<TouchableOpacity
				style={[styles.dateBtn, { backgroundColor: isDark ? '#1E1E1E' : '#F7F7F7' }]}
				onPress={() => {
					setShowDatePicker(true);
					bump('Light');
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
					onChange={(_, date) => {
						if (Platform.OS !== 'ios') setShowDatePicker(false);
						if (date) setLastWatered(date);
					}}
				/>
			)}
		</View>
	);

	/* ---------- render ---------- */
	return (
		<Modal visible={visible} animationType="fade" onRequestClose={onClose}>
			<KeyboardAvoidingView
				style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFF' }]}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				{showSuccess && (
					<SuccessAnimation title="Plant Updated!" onAnimationComplete={finish} />
				)}

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
						<NamingStep key="0" />,
						<LightStep key="1" />,
						<PotStep key="2" />,
						<SoilStep key="3" />,
						<LocationStep key="4" />,
						<LastWateredStep key="5" />,
					][step]
				}

				{/* CTA */}
				<View style={styles.cta}>
					<Button onPress={next} fullWidth size="large" disabled={isUploading}>
						{step < 5 ? 'Next' : isUploading ? 'Uploading…' : 'Save Changes'}
					</Button>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

/* ---------- styles (unchanged) ---------- */
const styles = StyleSheet.create({
	container: { flex: 1 },

	/* nav */
	navRow: {
		position: 'absolute',
		left: 20,
		right: 20,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
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

	/* dots */
	dotRow: { flexDirection: 'row', gap: 8 },
	dot: { width: 10, height: 10, borderRadius: 5 },

	/* main content */
	content: {
		flex: 1,
		paddingTop: Platform.OS === 'ios' ? 100 : 70,
		paddingHorizontal: 20,
		alignItems: 'center',
	},

	/* avatar */
	imgWrap: { position: 'relative', marginBottom: 32, ...COLORS.shadowLg },
	avatar: {
		width: 180,
		height: 180,
		borderRadius: 24,
		borderWidth: 2,
		borderColor: COLORS.border,
	},
	uploadVeil: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: '#FFFFFFDD',
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},
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
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		width: 160,
	},
	plantBadgeText: { fontSize: 14, fontWeight: '600' },

	/* text */
	title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
	subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24 },

	/* nickname */
	nameRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
	inputWrap: { flex: 1, borderRadius: 16, borderWidth: 2, borderColor: COLORS.border },
	input: { height: 56, borderRadius: 16, paddingHorizontal: 16, fontSize: 16 },
	errorText: { fontSize: 12, marginTop: 4, marginLeft: 4 },
	diceBtn: {
		width: 56,
		height: 56,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},

	/* cards / rows */
	card: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		padding: 16,
		borderRadius: 16,
		borderColor: COLORS.border,
		marginBottom: 12,
		...COLORS.shadow,
	},
	cardTitle: { fontSize: 16, fontWeight: '600' },
	cardDesc: { fontSize: 13, marginTop: 4 },

	potVal: { fontSize: 44, fontWeight: '700', marginVertical: 16 },

	soilRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		padding: 16,
		borderRadius: 16,
		borderColor: COLORS.border,
		width: '100%',
		marginTop: 16,
		...COLORS.shadow,
	},

	/* date */
	dateBtn: {
		width: '100%',
		borderRadius: 16,
		paddingVertical: 16,
		alignItems: 'center',
		marginTop: 16,
		...COLORS.shadow,
	},
	dateBtnText: { fontSize: 18, fontWeight: '600' },

	/* footer */
	cta: { position: 'absolute', bottom: 20, left: 20, right: 20 },
});
