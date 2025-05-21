import { FlatList } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import * as Haptics from 'expo-haptics'; // ← Import Haptics
import { useMixpanel } from '@/hooks/useMixpanel';
import { useRef, useState } from 'react';
import { Dimensions, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';

export default function GetStartedScreen() {
	// Analytics
	useMixpanel('features');

	const FEATURE_CARDS = [
		{
			key: 'say-goodbye',
			title: 'Say goodbye to your plant problems with Florai 👋',
			description: '',
			Illustration:
				'https://leafly-app.s3.eu-west-2.amazonaws.com/Taking+care+of+plants-02.svg',
		},
		{
			key: 'instant-id',
			title: 'Instant Identification 📸',
			description: 'Snap a pic and get instant plant identification with 97% accuracy.',
			Illustration: 'https://leafly-app.s3.eu-west-2.amazonaws.com/identify-plant.svg',
		},
		{
			key: 'smart-care',
			title: 'Smart Reminders 📅',
			description: 'Get personalized care based on your plant’s individual needs.',
			Illustration: 'https://leafly-app.s3.eu-west-2.amazonaws.com/smart-reminders.svg',
		},
		{
			key: 'pet-safe',
			title: 'Pet-Safe Alerts ‼️',
			description: 'We warn you if Fluffy shouldn’t nibble it.',
			Illustration: 'https://leafly-app.s3.eu-west-2.amazonaws.com/pet-safe-new.svg',
		},
		{
			key: 'plant-doctor',
			title: 'Plant Doctor 🚑',
			description: 'Get instant diagnosis and treatment for your plant’s ailments.',
			Illustration: 'https://leafly-app.s3.eu-west-2.amazonaws.com/plant-doctor.svg',
		},
	];

	const flatListRef = useRef<FlatList>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const insets = useSafeAreaInsets();
	const { width } = Dimensions.get('window');

	// Fire a light haptic before scrolling or navigating
	const handleNext = async () => {
		await Haptics.selectionAsync();
		if (currentIndex < FEATURE_CARDS.length - 1) {
			flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
		} else {
			router.push('/generating');
		}
	};

	const blurhash =
		'|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';
	const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
		if (viewableItems.length > 0) {
			setCurrentIndex(viewableItems[0].index);
		}
	}).current;

	const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });
	const current = FEATURE_CARDS[currentIndex];

	return (
		<View style={styles.container}>
			{/* ── Illustration Slider ───────────────────────── */}
			<View style={styles.sliderContainer}>
				<FlatList
					ref={flatListRef}
					data={FEATURE_CARDS}
					keyExtractor={(item) => item.key}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					bounces={false}
					onViewableItemsChanged={onViewableItemsChanged}
					viewabilityConfig={viewConfigRef.current}
					renderItem={({ item }) => (
						<View
							style={[
								styles.slide,
								{
									width,
									position: 'relative',
									paddingTop: insets.top - 24,
								},
							]}
						>
							<Image
								style={{
									flex: 1,
									width: '100%',
								}}
								source={item.Illustration}
								placeholder={{ blurhash }}
								contentFit="contain"
								transition={0}
							/>
						</View>
					)}
				/>
			</View>

			{/* ── Fixed Bottom Sheet ───────────────────────── */}
			<View style={styles.bottomSheet}>
				<Text style={styles.title}>{current.title}</Text>
				<Text style={styles.description}>{current.description}</Text>

				<View style={styles.dotsContainer}>
					{FEATURE_CARDS.map((_, idx) => (
						<View
							key={idx}
							style={[styles.dot, { opacity: idx === currentIndex ? 1 : 0.3 }]}
						/>
					))}
				</View>

				<Button onPress={handleNext} style={styles.ctaBtn} size="large">
					{currentIndex === FEATURE_CARDS.length - 1 ? 'Setup my profile' : 'Next'}
				</Button>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},

	sliderContainer: {
		flex: 4, // 60% of vertical space
		overflow: 'hidden',
		backgroundColor: '#E6F2FF',
	},

	slide: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 16,
	},

	bottomSheet: {
		flex: 4, // 40% of vertical space
		backgroundColor: '#fff',
		marginTop: -32, // overlaps the video
		borderTopLeftRadius: 40,
		borderTopRightRadius: 40,
		paddingHorizontal: 24,
		alignItems: 'center',
		justifyContent: 'center',
	},

	title: {
		fontSize: 30,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 12,
	},

	description: {
		fontSize: 18,
		textAlign: 'center',
		marginBottom: 28,
	},

	dotsContainer: {
		marginBottom: 16,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},

	dot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: COLORS.primary ?? '#3DBE29',
		marginHorizontal: 4,
	},
	ctaBtn: {
		width: '100%',
	},
});
