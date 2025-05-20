import React from 'react';
import {
	View,
	StyleSheet,
	TouchableOpacity,
	Share,
	ImageBackground,
	ScrollView,
	Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Share2, Users, Heart, Trophy } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from './constants/colors';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';

const { width } = Dimensions.get('window');

const features = [
	{ icon: <Users size={28} color="#fff" />, title: 'Grow Together', bg: '#58CC02' },
	{ icon: <Heart size={28} color="#fff" />, title: 'Build Community', bg: '#FFDD00' },
	{ icon: <Trophy size={28} color="#fff" />, title: 'Track Progress', bg: '#00C2C7' },
];

export default function ShareScreen() {
	const insets = useSafeAreaInsets();

	const onShare = async () => {
		try {
			await Share.share({
				message:
					'Join me on florai! Let’s grow our green family together: https://florai.app',
				title: 'Invite to florai',
			});
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<View style={[styles.container, { paddingTop: insets.top }]}>
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
					<ChevronLeft size={24} color={COLORS.text.primary.light} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Share with Friends</Text>
			</View>

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Hero */}
				<ImageBackground
					source={{
						uri: 'https://images.pexels.com/photos/5858235/pexels-photo-5858235.jpeg',
					}}
					style={styles.hero}
					imageStyle={{ borderRadius: 20 }}
				>
					<View style={styles.heroOverlay}>
						<Text style={styles.heroTitle}>Share the Joy</Text>
						<Text style={styles.heroSubtitle}>
							Invite friends and grow your plant community together!
						</Text>
					</View>
				</ImageBackground>

				{/* Features */}
				<Text style={styles.sectionTitle}>Why Share?</Text>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={styles.featureScroll}
				>
					{features.map((f) => (
						<View key={f.title} style={[styles.featureCard, { backgroundColor: f.bg }]}>
							{f.icon}
							<Text style={styles.featureText}>{f.title}</Text>
						</View>
					))}
				</ScrollView>

				{/* Stats Section */}
				<View style={styles.statsSection}>
					<View style={styles.statsTextContainer}>
						<Text style={styles.statsTitle}>Join Plant Lovers</Text>
						<Text style={styles.statsDesc}>
							Be part of a thriving green community—share tips, challenges, and
							celebrations.
						</Text>
					</View>
					<View style={styles.statsImageContainer}>
						<ImageBackground
							source={{
								uri: 'https://images.pexels.com/photos/7663889/pexels-photo-7663889.jpeg',
							}}
							style={styles.statsImage}
							imageStyle={{ borderRadius: 16 }}
						/>
					</View>
				</View>
			</ScrollView>

			<View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
				<Button onPress={onShare} icon={<Share2 size={20} color="#fff" />} fullWidth>
					Invite Friends
				</Button>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#f9f9f9' },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
		backgroundColor: '#fff',
	},
	backButton: {
		padding: 8,
		marginRight: 8,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: COLORS.text.primary.light,
	},

	scrollContent: { padding: 16 },

	hero: { width: width - 32, height: 200, alignSelf: 'center', marginBottom: 24 },
	heroOverlay: {
		flex: 1,
		justifyContent: 'flex-end',
		padding: 16,
		backgroundColor: 'rgba(0,0,0,0.3)',
		borderRadius: 20,
	},
	heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 },
	heroSubtitle: { fontSize: 14, color: '#fff', lineHeight: 20 },

	sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
	featureScroll: { marginBottom: 24 },

	featureCard: {
		width: 140,
		height: 140,
		borderRadius: 20,
		marginRight: 16,
		padding: 16,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	featureText: {
		marginTop: 8,
		fontSize: 16,
		fontWeight: '600',
		color: '#fff',
		textAlign: 'center',
	},

	statsSection: {
		flexDirection: 'row',
		backgroundColor: '#fff',
		borderRadius: 16,
		overflow: 'hidden',
		elevation: 2,
		marginBottom: 24,
	},
	statsTextContainer: { flex: 1, padding: 16, justifyContent: 'center' },
	statsTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
	statsDesc: { fontSize: 14, color: '#666', lineHeight: 20 },
	statsImageContainer: { width: 120, height: 120, margin: 16 },
	statsImage: { flex: 1 },

	footer: { padding: 16, backgroundColor: '#fff' },
});
