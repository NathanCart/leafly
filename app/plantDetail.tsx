import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	useColorScheme,
} from 'react-native';
import { usePlants } from '@/hooks/usePlants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { COLORS } from './constants/colors';

export default function PlantDetail() {
	const { getPlantById } = usePlants();
	const params = useLocalSearchParams<{ id: string }>();
	const plantId = params.id!;
	const router = useRouter();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';

	const [plant, setPlant] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const p = await getPlantById(plantId);
				setPlant(p);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		})();
	}, [plantId]);

	if (loading) {
		return (
			<View
				style={[
					styles.center,
					{ backgroundColor: isDark ? COLORS.background.dark : COLORS.surface.light },
				]}
			>
				<ActivityIndicator size="large" color={COLORS.primary} />
			</View>
		);
	}

	if (!plant) {
		return (
			<View
				style={[
					styles.center,
					{ backgroundColor: isDark ? COLORS.background.dark : COLORS.surface.light },
				]}
			>
				<Text
					style={[
						styles.errorText,
						{ color: isDark ? COLORS.text.primary.dark : COLORS.text.primary.light },
					]}
				>
					Couldn’t load plant.
				</Text>
				<TouchableOpacity onPress={() => router.back()}>
					<Text
						style={[
							styles.closeText,
							{
								color: isDark
									? COLORS.text.primary.dark
									: COLORS.text.primary.light,
							},
						]}
					>
						Close
					</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<ScrollView
			contentContainerStyle={[
				styles.container,
				{ backgroundColor: isDark ? COLORS.background.dark : COLORS.surface.light },
			]}
		>
			{/* Header */}
			<Text
				style={[
					styles.title,
					{ color: isDark ? COLORS.text.primary.dark : COLORS.text.primary.light },
				]}
			>
				{plant.nickname}
			</Text>
			<Text
				style={[
					styles.subtitle,
					{ color: isDark ? COLORS.text.secondary.dark : COLORS.text.secondary.light },
				]}
			>
				{plant.name}
			</Text>

			{/* Image with + badge */}
			{plant.image_url && (
				<View style={styles.imageWrapper}>
					<Image source={{ uri: plant.image_url }} style={styles.image} />
					<TouchableOpacity
						style={[
							styles.badge,
							{ backgroundColor: isDark ? COLORS.surface.dark : COLORS.card.light },
						]}
					>
						<Feather
							name="plus"
							size={16}
							color={isDark ? COLORS.text.primary.dark : COLORS.text.primary.light}
						/>
					</TouchableOpacity>
				</View>
			)}

			{/* Actions list */}
			<View style={styles.actions}>
				<ActionRow
					icon={<Feather name="edit-2" size={20} />}
					label="Edit Details"
					onPress={() => {}}
				/>
				<ActionRow
					icon={<MaterialCommunityIcons name="image-multiple" size={20} />}
					label="View Gallery"
					onPress={() => {}}
				/>
				<ActionRow
					icon={<Feather name="camera" size={20} />}
					label="Track Progress"
					onPress={() => {}}
				/>
				<ActionRow
					icon={<Entypo name="share-alternative" size={20} />}
					label="Share"
					onPress={() => {}}
				/>
				<ActionRow
					icon={<MaterialCommunityIcons name="stethoscope" size={20} />}
					label="Get Expert Help"
					onPress={() => {}}
				/>
				<ActionRow
					icon={<Entypo name="circle-with-minus" size={20} />}
					label="Remove this Plant"
					onPress={() => {}}
					destructive
				/>
			</View>

			{/* Close button */}
			<TouchableOpacity style={styles.closeBtnContainer} onPress={() => router.back()}>
				<Text
					style={[
						styles.closeText,
						{ color: isDark ? COLORS.text.primary.dark : COLORS.text.primary.light },
					]}
				>
					Close
				</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

type ActionRowProps = {
	icon: React.ReactNode;
	label: string;
	onPress: () => void;
	destructive?: boolean;
};
function ActionRow({ icon, label, onPress, destructive }: ActionRowProps) {
	return (
		<TouchableOpacity onPress={onPress} style={styles.row}>
			<View style={styles.iconContainer}>{icon}</View>
			<Text style={[styles.rowText, destructive && { color: COLORS.error }]}>{label}</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
	},
	container: {
		paddingTop: 32,
		paddingHorizontal: 24,
		paddingBottom: 40,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 14,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 1,
		marginTop: 4,
		textAlign: 'center',
	},
	imageWrapper: {
		alignSelf: 'center',
		marginTop: 24,
		width: 160,
		height: 160,
		borderRadius: 24,
		overflow: 'hidden',
		position: 'relative',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	badge: {
		position: 'absolute',
		bottom: 8,
		right: 8,
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 1.5,
		elevation: 2,
	},
	actions: {
		marginTop: 32,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: COLORS.surface.light,
	},
	iconContainer: {
		width: 32,
		alignItems: 'center',
	},
	rowText: {
		fontSize: 16,
		marginLeft: 16,
		color: COLORS.text.primary.light,
	},
	closeBtnContainer: {
		marginTop: 32,
		alignSelf: 'center',
	},
	closeText: {
		fontSize: 16,
		fontWeight: '600',
	},
	errorText: {
		fontSize: 16,
	},
});
