import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useMixpanel } from '@/hooks/useMixpanel';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

export default function GetStartedScreen() {
	// Analytics
	useMixpanel('features');

	const FEATURE_CARDS = [
		{
			key: 'instant-id',
			title: 'Instant Identification 📸',
			description: 'Snap a pic and get instant plant identification with 97% accuracy.',
			Illustration: 'https://leafly-app.s3.eu-west-2.amazonaws.com/identify.svg',
		},
		{
			key: 'smart-care',
			title: 'Smart Reminders 📅',
			description: 'Get personalized care based on your plant’s individual needs.',
			Illustration: 'https://leafly-app.s3.eu-west-2.amazonaws.com/plant-care.svg',
		},
		{
			key: 'pet-safe',
			title: 'Pet-Safe Alerts ‼️',
			description: 'We warn you if Fluffy shouldn’t nibble it.',
			Illustration: 'https://leafly-app.s3.eu-west-2.amazonaws.com/pet-safe.svg',
		},
		{
			key: 'plant-doctor',
			title: 'Plant Doctor 🚑',
			description: 'Get instant diagnosis and treatment for your plant’s ailments.',
			Illustration: 'https://leafly-app.s3.eu-west-2.amazonaws.com/doctor.svg',
		},
	];

	const flatListRef = useRef<FlatList>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const insets = useSafeAreaInsets();
	const { width } = Dimensions.get('window');

	const handleNext = () => {
		if (currentIndex < FEATURE_CARDS.length - 1) {
			flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
		} else {
			router.push('/how-did-you-find');
		}
	};
	const blurhash =
		'|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';
	const onViewableItemsChanged = useRef(({ viewableItems }) => {
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
									backgroundColor: '#E6F2FF',
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
			<View style={[styles.bottomSheet, { paddingBottom: insets.bottom || 16 }]}>
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
					{currentIndex === FEATURE_CARDS.length - 1 ? 'Continue' : 'Next'}
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
		flex: 6, // 60% of vertical space
		overflow: 'hidden',
	},

	slide: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},

	illustrationContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 24,
	},

	bottomSheet: {
		flex: 4, // 40% of vertical space
		backgroundColor: '#fff',
		marginTop: -32, // overlaps the video
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
		paddingHorizontal: 24,
		paddingTop: 32,
		alignItems: 'center',
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
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: COLORS.primary ?? '#3DBE29',
		marginHorizontal: 4,
	},

	ctaBtn: {
		width: '100%',
		marginTop: 16,
		backgroundColor: COLORS.primary ?? '#3DBE29',
		borderRadius: 28,
		paddingVertical: 14,
		paddingHorizontal: 42,
	},
});
