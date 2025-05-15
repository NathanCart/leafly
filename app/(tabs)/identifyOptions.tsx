import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	StyleSheet,
	ScrollView,
	TextInput,
	TouchableOpacity,
	Image,
	FlatList,
	ActivityIndicator,
	Keyboard,
	Platform,
	Animated,
	useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, Camera, ChevronRight, X, Leaf } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { AddPlantModal } from '@/components/PlantIdentification/AddPlantModal';
import { usePlants } from '@/hooks/usePlants';
import { usePlantIdentification } from '@/hooks/usePlantIdentification';

const categories = [
	{ id: 'flower', name: 'Flower', icon: '🌺' },
	{ id: 'succulent', name: 'Succulent', icon: '🪴' },
	{ id: 'herb', name: 'Herb', icon: '🍃' },
	{ id: 'tree', name: 'Tree', icon: '🌲' },
	{ id: 'vegetable', name: 'Vegetable', icon: '🥦' },
];

// Renders one API "entity" result with press animation & haptics
const SearchResultCard = ({ entity, isDark, onPress }) => {
	const scale = useRef(new Animated.Value(1)).current;
	const thumbnailUri = entity.thumbnail ? `data:image/png;base64,${entity.thumbnail}` : null;

	const handlePressIn = () => {
		Animated.spring(scale, {
			toValue: 0.96,
			friction: 5,
			tension: 300,
			useNativeDriver: true,
		}).start();
	};
	const handlePressOut = () => {
		Animated.spring(scale, {
			toValue: 1,
			friction: 3,
			tension: 200,
			useNativeDriver: true,
		}).start();
	};
	const handlePress = () => {
		Haptics.selectionAsync();
		onPress(entity);
	};

	return (
		<Animated.View style={{ transform: [{ scale }], marginBottom: 12 }}>
			<TouchableOpacity
				style={styles.card}
				onPress={handlePress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				activeOpacity={0.9}
			>
				<View style={COLORS.shadowLg}>
					<Image source={{ uri: thumbnailUri ?? '' }} style={styles.plantImageData} />
				</View>
				<View style={styles.cardContent}>
					<View style={styles.cardHeader}>
						<Text style={styles.cardPlant}>{entity.entity_name}</Text>
					</View>
					<View style={styles.cardRow}>
						<Text style={[styles.cardPlant, { color: COLORS.muted, fontSize: 14 }]}>
							{entity.matched_in}
						</Text>
					</View>
				</View>
			</TouchableOpacity>
		</Animated.View>
	);
};

const CategoryButton = ({ category, isDark, onPress }) => {
	const scale = useRef(new Animated.Value(1)).current;
	return (
		<Animated.View style={{ transform: [{ scale }], marginRight: 12 }}>
			<TouchableOpacity
				onPress={onPress}
				onPressIn={() =>
					Animated.spring(scale, {
						toValue: 0.95,
						friction: 5,
						tension: 300,
						useNativeDriver: true,
					}).start()
				}
				onPressOut={() =>
					Animated.spring(scale, {
						toValue: 1,
						friction: 3,
						tension: 200,
						useNativeDriver: true,
					}).start()
				}
				style={[styles.categoryButton, { borderColor: COLORS.border }]}
				activeOpacity={0.8}
			>
				<View
					style={[
						styles.categoryIconContainer,
						{ backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' },
					]}
				>
					<Text style={styles.categoryIcon}>{category.icon}</Text>
				</View>
				<Text
					style={[styles.categoryText, { color: isDark ? '#E0E0E0' : '#283618' }]}
					numberOfLines={1}
				>
					{category.name}
				</Text>
			</TouchableOpacity>
		</Animated.View>
	);
};

const RecentSearchItem = ({ term, isDark, onPress }) => {
	const bg = useRef(new Animated.Value(0)).current;
	const backgroundColor = bg.interpolate({
		inputRange: [0, 1],
		outputRange: ['transparent', isDark ? '#333333' : '#F0F4E4'],
	});
	return (
		<Animated.View style={[styles.recentSearchItem, { backgroundColor }]}>
			<TouchableOpacity
				style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
				onPress={onPress}
				onPressIn={() =>
					Animated.timing(bg, {
						toValue: 1,
						duration: 150,
						useNativeDriver: false,
					}).start()
				}
				onPressOut={() =>
					Animated.timing(bg, {
						toValue: 0,
						duration: 200,
						useNativeDriver: false,
					}).start()
				}
				activeOpacity={0.8}
			>
				<SearchIcon size={16} color={isDark ? '#A0A0A0' : COLORS.muted} />
				<Text style={[styles.recentSearchText, { color: isDark ? '#E0E0E0' : '#283618' }]}>
					{term}
				</Text>
			</TouchableOpacity>
		</Animated.View>
	);
};

export default function IdentifyScreen() {
	const [searchQuery, setSearchQuery] = useState('');
	const [isSearching, setIsSearching] = useState(false);
	const [searchResults, setSearchResults] = useState([]);
	const [recentSearches, setRecentSearches] = useState([]);
	const [selectedPlant, setSelectedPlant] = useState(null);
	const [showAddPlantModal, setShowAddPlantModal] = useState(false);

	const searchTimer = useRef(null);
	const recentTimer = useRef(null);
	const inputRef = useRef(null);

	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(20)).current;

	const colorScheme = Platform.OS === 'web' ? 'light' : useColorScheme();
	const isDark = colorScheme === 'dark';
	const insets = useSafeAreaInsets();

	// load persisted searches + animate in
	useEffect(() => {
		(async () => {
			const saved = await AsyncStorage.getItem('@recent_searches');
			if (saved) setRecentSearches(JSON.parse(saved));
		})();
		Animated.parallel([
			Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
			Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
		]).start();
	}, []);

	// actual API call
	const doSearch = async (term) => {
		setIsSearching(true);
		Keyboard.dismiss();
		try {
			const params = new URLSearchParams({
				q: term,
				limit: '10',
				language: 'en',
				thumbnails: 'true',
			});
			const res = await fetch(
				`https://plant.id/api/v3/kb/plants/name_search?${params.toString()}`,
				{ headers: { 'Api-Key': process.env.EXPO_PUBLIC_PLANT_ID_KEY! } }
			);
			const json = await res.json();
			setSearchResults(json.entities || []);
		} catch (e) {
			console.warn('Plant search failed', e);
			setSearchResults([]);
		}
		setIsSearching(false);
	};

	// debounce typing → search after 500ms
	useEffect(() => {
		clearTimeout(searchTimer.current);
		if (!searchQuery.trim()) {
			setSearchResults([]);
		} else {
			searchTimer.current = setTimeout(() => doSearch(searchQuery.trim()), 500);
		}
		return () => clearTimeout(searchTimer.current);
	}, [searchQuery]);

	// debounce typing → add to recents after 3s
	useEffect(() => {
		clearTimeout(recentTimer.current);
		const term = searchQuery.trim();
		if (term) {
			recentTimer.current = setTimeout(async () => {
				setRecentSearches((prev) => {
					const next = [term, ...prev.filter((t) => t !== term)].slice(0, 10);
					AsyncStorage.setItem('@recent_searches', JSON.stringify(next)).catch(
						console.warn
					);
					return next;
				});
			}, 3000);
		}
		return () => clearTimeout(recentTimer.current);
	}, [searchQuery]);

	const clearSearch = () => {
		setSearchQuery('');
		setSearchResults([]);
		inputRef.current?.blur();
	};
	const clearAllRecents = async () => {
		await AsyncStorage.removeItem('@recent_searches');
		setRecentSearches([]);
	};
	const handleScanPress = () => router.replace('/identify');
	const onCategoryPress = (c) => setSearchQuery(c.name);
	const handleSelectPlant = (plant) => {
		setSelectedPlant(plant);
		setShowAddPlantModal(true);
	};

	const { addPlant } = usePlants();
	const { getPlantById } = usePlantIdentification();

	// Only addPlant here—navigation happens AFTER the SuccessAnimation in AddPlantModal
	const confirmPlantSelection = async (nickname: string, imageUri: string) => {
		if (!selectedPlant) return;

		console.log(imageUri, 'selectedPlant data image');

		try {
			const plant = await getPlantById(selectedPlant?.access_token);

			console.log(plant, 'plant data found');

			await addPlant({
				...plant,
				nickname: nickname || plant?.entity_name,
				capturedImageUri: !!imageUri ? imageUri : plant?.image?.citation,
			});
			// do NOT navigate here
		} catch (err) {
			console.error('Error saving plant:', err);
		}
	};
	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: isDark ? '#121212' : '#FFFFFF', paddingTop: insets.top + 8 },
			]}
		>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollViewContent}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
				stickyHeaderIndices={[0]}
			>
				<Animated.View
					style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
				>
					<View style={{ backgroundColor: isDark ? '#121212' : '#FFFFFF' }}>
						{/* Header */}
						<View style={styles.header}>
							<Leaf color={COLORS.tabBar.active} size={24} />
							<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
								Plant Finder
							</Text>
						</View>

						{/* Search Bar */}
						<View style={styles.searchContainer}>
							<View style={[styles.searchBar, { borderColor: COLORS.border }]}>
								<SearchIcon size={20} color={isDark ? '#A0A0A0' : '#9C9C9C'} />
								<TextInput
									ref={inputRef}
									style={[
										styles.searchInput,
										{ color: isDark ? '#E0E0E0' : '#283618' },
									]}
									placeholder="Search plant name..."
									placeholderTextColor={isDark ? '#A0A0A0' : '#9C9C9C'}
									value={searchQuery}
									onChangeText={setSearchQuery}
									returnKeyType="search"
								/>
								{!!searchQuery && (
									<TouchableOpacity onPress={clearSearch}>
										<X size={20} color={isDark ? '#A0A0A0' : '#A0A0A0'} />
									</TouchableOpacity>
								)}
							</View>
							<TouchableOpacity
								style={styles.cameraButton}
								onPress={handleScanPress}
								activeOpacity={0.8}
							>
								<Camera size={24} color="#FFFFFF" />
							</TouchableOpacity>
						</View>
					</View>
				</Animated.View>

				{isSearching ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color="#606C38" />
						<Text
							style={[styles.loadingText, { color: isDark ? '#E0E0E0' : '#283618' }]}
						>
							Searching plants...
						</Text>
					</View>
				) : searchResults.length > 0 ? (
					<View style={styles.resultsContainer}>
						<Text
							style={[styles.sectionTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}
						>
							Search Results
						</Text>
						{searchResults.map((entity) => (
							<SearchResultCard
								key={entity.access_token}
								entity={entity}
								isDark={isDark}
								onPress={handleSelectPlant}
							/>
						))}
						<Button onPress={clearSearch} variant="secondary">
							Clear Results
						</Button>
					</View>
				) : searchQuery.trim() ? (
					<View style={styles.noResultsContainer}>
						<Text
							style={[
								styles.noResultsText,
								{ color: isDark ? '#E0E0E0' : '#283618' },
							]}
						>
							No results found for "{searchQuery}"
						</Text>
						<Button onPress={clearSearch} variant="secondary">
							Clear Search
						</Button>
					</View>
				) : (
					<>
						{/* Scan */}
						<View style={styles.scanContainer}>
							<TouchableOpacity
								style={[
									styles.scanCard,
									{ backgroundColor: isDark ? '#2A2A2A' : '#F0F4E4' },
								]}
								onPress={handleScanPress}
								activeOpacity={0.8}
							>
								<Camera size={28} color={isDark ? '#A3B18A' : COLORS.primary} />
								<View style={styles.scanTextContainer}>
									<Text
										style={[
											styles.scanTitle,
											{ color: isDark ? '#E0E0E0' : '#283618' },
										]}
									>
										Scan to Identify
									</Text>
									<Text
										style={[
											styles.scanSubtitle,
											{ color: isDark ? '#A0A0A0' : COLORS.muted },
										]}
									>
										Take a photo of a plant to identify it instantly
									</Text>
								</View>
								<ChevronRight
									size={20}
									color={isDark ? '#A0A0A0' : COLORS.primary}
								/>
							</TouchableOpacity>
						</View>

						{/* Categories */}
						<View style={styles.categoriesSection}>
							<View style={styles.sectionHeader}>
								<Text
									style={[
										styles.sectionTitle,
										{ color: isDark ? '#E0E0E0' : '#283618' },
									]}
								>
									Popular Categories
								</Text>
							</View>
							<FlatList
								data={categories}
								horizontal
								keyExtractor={(c) => c.id}
								renderItem={({ item }) => (
									<CategoryButton
										category={item}
										isDark={isDark}
										onPress={() => onCategoryPress(item)}
									/>
								)}
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.categoriesList}
							/>
						</View>

						{/* Recent Searches */}
						{recentSearches.length > 0 && (
							<View>
								<View style={styles.sectionHeader}>
									<Text
										style={[
											styles.sectionTitle,
											{ color: isDark ? '#E0E0E0' : '#283618' },
										]}
									>
										Recent Searches
									</Text>
									<TouchableOpacity onPress={clearAllRecents}>
										<Text
											style={[
												styles.seeAllButton,
												{ color: isDark ? '#A3B18A' : COLORS.primary },
											]}
										>
											Clear All
										</Text>
									</TouchableOpacity>
								</View>
								{recentSearches.map((term, i) => (
									<RecentSearchItem
										key={i}
										term={term}
										isDark={isDark}
										onPress={() => setSearchQuery(term)}
									/>
								))}
							</View>
						)}
					</>
				)}
			</ScrollView>

			{selectedPlant && (
				<AddPlantModal
					visible={showAddPlantModal}
					onClose={() => {
						setSelectedPlant(null);
						setShowAddPlantModal(false);
					}}
					plant={{
						name: selectedPlant?.entity_name,
						capturedImageUri: selectedPlant.thumbnail
							? `data:image/png;base64,${selectedPlant.thumbnail}`
							: null,
					}}
					isDark={isDark}
					onConfirm={confirmPlantSelection}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
		paddingHorizontal: 16,
	},
	title: { fontSize: 24, fontWeight: '700', marginLeft: 8 },
	scrollView: { flex: 1 },
	scrollViewContent: { paddingBottom: 24 },
	searchContainer: { flexDirection: 'row', marginBottom: 24, paddingHorizontal: 16 },
	searchBar: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		height: 44,
		borderRadius: 22,
		paddingHorizontal: 16,
		marginRight: 12,
		borderWidth: 2,
		borderColor: COLORS.border,
	},
	searchInput: { flex: 1, height: '100%', marginLeft: 8, fontSize: 16 },
	cameraButton: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: COLORS.primary,
		alignItems: 'center',
		justifyContent: 'center',
	},
	loadingContainer: { padding: 40, alignItems: 'center' },
	loadingText: { marginTop: 16, fontSize: 16 },
	resultsContainer: { paddingHorizontal: 16 },
	sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
	noResultsContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 40,
	},
	noResultsText: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
	scanContainer: { marginBottom: 24, paddingHorizontal: 16 },
	scanCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		gap: 12,
	},
	scanTextContainer: { flex: 1, marginLeft: 12 },
	scanTitle: { fontSize: 16, fontWeight: '600' },
	scanSubtitle: { fontSize: 14, marginTop: 4 },
	categoriesSection: { marginBottom: 24 },
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
		paddingHorizontal: 16,
	},
	categoriesList: { paddingRight: 8, paddingLeft: 16 },
	categoryButton: {
		width: 100,
		borderRadius: 12,
		padding: 12,
		alignItems: 'center',
		borderWidth: 2,
	},
	categoryIconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8,
	},
	categoryIcon: { fontSize: 24 },
	categoryText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
	recentSearchItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderRadius: 8,
		borderColor: COLORS.border,
		borderWidth: 2,
		marginBottom: 8,
		marginHorizontal: 16,
	},
	recentSearchText: { fontSize: 15, marginLeft: 8 },
	seeAllButton: { fontSize: 16, fontWeight: '700' },
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF',
		padding: 12,
		marginBottom: 12,
		borderBottomWidth: 2,
		borderColor: COLORS.border,
		borderRadius: 12,
	},
	plantImageData: {
		width: 56,
		height: 56,
		borderRadius: 14,
		objectFit: 'cover',
		marginRight: 12,
	},
	cardContent: { flex: 1 },
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	cardPlant: { fontSize: 16, fontWeight: '600', color: '#111827' },
});
