import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Image,
	TextInput,
	useColorScheme,
	Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, Plus, Leaf, Settings, Filter, Droplet } from 'lucide-react-native';
import { useMyPlants } from '@/data/plants';
import { COLORS } from '@/app/constants/colors';

export default function CollectionScreen() {
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';
	const [searchQuery, setSearchQuery] = useState('');
	const [activeFilter, setActiveFilter] = useState('All');
	const insets = useSafeAreaInsets();

	const { myPlants, loading } = useMyPlants();
	const filterOptions = ['All', 'Indoor', 'Outdoor', 'Favorites'];
	const screenWidth = Dimensions.get('window').width;

	// Filter plants based on search query and active filter
	const filteredPlants = (myPlants || []).filter((plant) => {
		const matchesSearch =
			plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(plant.nickname && plant.nickname.toLowerCase().includes(searchQuery.toLowerCase()));
		const matchesFilter =
			activeFilter === 'All' ||
			(activeFilter === 'Indoor' && plant.location === 'Indoor') ||
			(activeFilter === 'Outdoor' && plant.location === 'Outdoor') ||
			(activeFilter === 'Favorites' && plant.is_favorite);

		return matchesSearch && matchesFilter;
	});

	const renderPlantItem = ({ item }) => (
		<TouchableOpacity
			style={[
				styles.plantCard,
				{ backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' },
				{ width: (screenWidth - 60) / 2 }, // Adjust for 2 columns with padding
			]}
			onPress={() =>
				router.push({
					pathname: '/plantDetail',
					params: { id: item.id },
				})
			}
		>
			{item.image_url ? (
				<Image source={{ uri: item.image_url }} style={styles.plantImage} />
			) : (
				<View
					style={[
						styles.plantImagePlaceholder,
						{ backgroundColor: isDark ? '#1A2A20' : '#E6F2E8' },
					]}
				>
					<Leaf color={COLORS.tabBar.active} size={32} />
				</View>
			)}

			<View style={styles.plantCardContent}>
				<Text
					style={[styles.plantName, { color: isDark ? '#E0E0E0' : '#283618' }]}
					numberOfLines={1}
				>
					{item.nickname || item.name}
				</Text>

				<Text
					style={[styles.plantSpecies, { color: COLORS.tabBar.inactive }]}
					numberOfLines={1}
				>
					{item.name}
				</Text>

				<View style={styles.plantCardFooter}>
					<View
						style={[
							styles.healthIndicator,
							{ backgroundColor: getHealthColor(item.health_status, isDark) },
						]}
					>
						<Text
							style={[styles.healthText, { color: isDark ? '#E0E0E0' : '#283618' }]}
						>
							{item.health_status || 'Healthy'}
						</Text>
					</View>

					{item.next_watering && (
						<View
							style={[
								styles.waterIndicator,
								{ backgroundColor: isDark ? '#2A4256' : '#E0F2FF' },
							]}
						>
							<Droplet size={12} color={isDark ? '#88CCFF' : '#0080FF'} />
							<Text
								style={[
									styles.waterText,
									{ color: isDark ? '#88CCFF' : '#0080FF' },
								]}
							>
								{item.next_watering}
							</Text>
						</View>
					)}
				</View>
			</View>
		</TouchableOpacity>
	);

	// Function to determine health indicator color
	function getHealthColor(health: string | null, isDark: boolean) {
		switch (health?.toLowerCase()) {
			case 'healthy':
				return isDark ? '#2A5A35' : '#E6F2E8';
			case 'needs attention':
				return isDark ? '#5A4A2A' : '#FFF3E0';
			case 'unhealthy':
				return isDark ? '#5A2A2A' : '#FFE0E0';
			default:
				return isDark ? '#2A5A35' : '#E6F2E8';
		}
	}

	if (loading) {
		return (
			<View
				style={[
					styles.container,
					{ backgroundColor: isDark ? '#121212' : '#F5F5F5' },
					{ paddingTop: insets.top + 8 },
				]}
			>
				<View style={styles.emptyContainer}>
					<Text style={[styles.emptyText, { color: COLORS.tabBar.inactive }]}>
						Loading plants...
					</Text>
				</View>
			</View>
		);
	}

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: isDark ? '#121212' : '#F5F5F5' },
				{ paddingTop: insets.top + 8 },
			]}
		>
			<View style={styles.header}>
				<View style={styles.titleContainer}>
					<Leaf color={COLORS.tabBar.active} size={24} />
					<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
						My Plants
					</Text>
				</View>
			</View>

			<View style={styles.searchContainer}>
				<View
					style={[
						styles.searchInputContainer,
						{ backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' },
					]}
				>
					<Search color={COLORS.tabBar.inactive} size={20} />
					<TextInput
						style={[styles.searchInput, { color: isDark ? '#E0E0E0' : '#283618' }]}
						placeholder="Search plants..."
						placeholderTextColor={COLORS.tabBar.inactive}
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
				</View>
			</View>

			<View style={styles.filterContainer}>
				<FlatList
					data={filterOptions}
					horizontal
					showsHorizontalScrollIndicator={false}
					keyExtractor={(item) => item}
					renderItem={({ item }) => (
						<TouchableOpacity
							style={[
								styles.filterOption,
								activeFilter === item && styles.activeFilterOption,
								activeFilter === item && { backgroundColor: COLORS.tabBar.active },
							]}
							onPress={() => setActiveFilter(item)}
						>
							<Text
								style={[
									styles.filterText,
									activeFilter === item && styles.activeFilterText,
									{
										color:
											activeFilter === item
												? '#FFFFFF'
												: COLORS.tabBar.inactive,
									},
								]}
							>
								{item}
							</Text>
						</TouchableOpacity>
					)}
					contentContainerStyle={styles.filterList}
				/>
			</View>

			<FlatList
				data={filteredPlants}
				renderItem={renderPlantItem}
				keyExtractor={(item) => item.id}
				numColumns={2}
				contentContainerStyle={styles.plantList}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Leaf color={isDark ? '#555555' : '#CCCCCC'} size={40} />
						<Text style={[styles.emptyText, { color: COLORS.tabBar.inactive }]}>
							{searchQuery
								? 'No plants match your search'
								: 'No plants in this category'}
						</Text>
					</View>
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		marginBottom: 20,
	},
	titleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		marginLeft: 8,
	},
	searchContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		marginBottom: 16,
	},
	searchInputContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		height: 44,
		borderRadius: 22,
		paddingHorizontal: 16,
		marginRight: 12,
	},
	searchInput: {
		flex: 1,
		height: '100%',
		marginLeft: 8,
		fontSize: 16,
	},
	filterButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: 'center',
		alignItems: 'center',
	},
	filterContainer: {
		marginBottom: 16,
	},
	filterList: {
		paddingHorizontal: 16,
	},
	filterOption: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		marginRight: 8,
	},
	activeFilterOption: {
		backgroundColor: COLORS.tabBar.active,
	},
	filterText: {
		fontSize: 14,
		fontWeight: '500',
	},
	activeFilterText: {
		color: 'white',
	},
	plantList: {
		paddingHorizontal: 16,
		paddingBottom: 100,
	},
	plantCard: {
		borderRadius: 16,
		overflow: 'hidden',
		marginBottom: 20,
		marginHorizontal: 5,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	plantImage: {
		width: '100%',
		height: 120,
		resizeMode: 'cover',
	},
	plantImagePlaceholder: {
		width: '100%',
		height: 120,
		justifyContent: 'center',
		alignItems: 'center',
	},
	plantCardContent: {
		padding: 12,
	},
	plantName: {
		fontSize: 16,
		fontWeight: '600',
	},
	plantSpecies: {
		fontSize: 12,
		marginTop: 2,
	},
	plantCardFooter: {
		flexDirection: 'row',
		marginTop: 8,
		flexWrap: 'wrap',
		gap: 6,
	},
	healthIndicator: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	healthText: {
		fontSize: 10,
		fontWeight: '500',
	},
	waterIndicator: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		gap: 4,
	},
	waterText: {
		fontSize: 10,
		fontWeight: '500',
	},
	emptyContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40,
	},
	emptyText: {
		fontSize: 16,
		marginTop: 12,
		textAlign: 'center',
	},
});
