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
import { router } from 'expo-router';
import { Search, Plus, Leaf, Settings, Filter, Droplet } from 'lucide-react-native';


// Import mock data
import { myPlants } from '@/data/plants';

export default function CollectionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  const filterOptions = ['All', 'Indoor', 'Outdoor', 'Favorites'];
  const screenWidth = Dimensions.get('window').width;
  
  // Filter plants based on search query and active filter
  const filteredPlants = myPlants.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      activeFilter === 'All' || 
      (activeFilter === 'Indoor' && plant.location === 'Indoor') ||
      (activeFilter === 'Outdoor' && plant.location === 'Outdoor') ||
      (activeFilter === 'Favorites' && plant.isFavorite);
    
    return matchesSearch && matchesFilter;
  });

  const renderPlantItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.plantCard,
        { backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' },
        { width: (screenWidth - 60) / 2 }, // Adjust for 2 columns with padding
      ]}
      onPress={() => router.push({
        pathname: '/plantDetail',
        params: { id: item.id, name: item.name }
      })}
    >
      <Image source={{ uri: item.image }} style={styles.plantImage} />
      
      <View style={styles.plantCardContent}>
        <Text 
          style={[styles.plantName, { color: isDark ? '#E0E0E0' : '#283618' }]}
          numberOfLines={1}
        >
          {item.nickname || item.name}
        </Text>
        
        <Text 
          style={[styles.plantSpecies, { color: isDark ? '#BBBBBB' : '#555555' }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        
        <View style={styles.plantCardFooter}>
          <View style={[
            styles.healthIndicator,
            { backgroundColor: getHealthColor(item.health, isDark) }
          ]}>
            <Text style={styles.healthText}>{item.health}</Text>
          </View>
          
          {item.nextWatering && (
            <View style={[
              styles.waterIndicator,
              { backgroundColor: isDark ? '#2A4256' : '#E0F2FF' }
            ]}>
              <Droplet size={12} color={isDark ? '#88CCFF' : '#0080FF'} />
              <Text style={[
                styles.waterText,
                { color: isDark ? '#88CCFF' : '#0080FF' }
              ]}>
                {item.nextWatering}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Function to determine health indicator color
  function getHealthColor(health, isDark) {
    switch (health) {
      case 'Healthy':
        return isDark ? '#2A5A35' : '#E6F2E8';
      case 'Needs Attention':
        return isDark ? '#5A4A2A' : '#FFF3E0';
      case 'Unhealthy':
        return isDark ? '#5A2A2A' : '#FFE0E0';
      default:
        return isDark ? '#2A5A35' : '#E6F2E8';
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Leaf color={isDark ? '#8EB69B' : '#3A8349'} size={24} />
          <Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
            My Plants
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Settings color={isDark ? '#E0E0E0' : '#283618'} size={24} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={[
          styles.searchInputContainer,
          { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }
        ]}>
          <Search color={isDark ? '#BBBBBB' : '#999999'} size={20} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#E0E0E0' : '#283618' }]}
            placeholder="Search plants..."
            placeholderTextColor={isDark ? '#BBBBBB' : '#999999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity style={[
          styles.filterButton,
          { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }
        ]}>
          <Filter color="#3A8349" size={20} />
        </TouchableOpacity>
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
                activeFilter === item && { backgroundColor: isDark ? '#3A8349' : '#3A8349' }
              ]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[
                styles.filterText,
                activeFilter === item && styles.activeFilterText,
                { color: activeFilter === item ? '#FFFFFF' : isDark ? '#BBBBBB' : '#555555' }
              ]}>
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
            <Text style={[styles.emptyText, { color: isDark ? '#BBBBBB' : '#555555' }]}>
              {searchQuery ? 'No plants match your search' : 'No plants in this category'}
            </Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: '#3A8349' }]}
        onPress={() => router.push('/(tabs)/identify')}
      >
        <Plus color="white" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterOption: {
    backgroundColor: '#3A8349',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  plantList: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Extra space for the FAB
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
    color: '#3A8349',
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
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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