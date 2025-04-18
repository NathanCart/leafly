import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Heart, Sun, Droplet, Wind, Info, Calendar, Share2, Thermometer } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Mock plant data - in a real app, this would come from your database
const plantData = {
  monstera: {
    id: 'monstera',
    name: 'Monstera Deliciosa',
    commonNames: ['Swiss Cheese Plant', 'Split-leaf Philodendron'],
    description: 'The Monstera deliciosa is a species of flowering plant native to tropical forests of southern Mexico, south to Panama. It has been introduced to many tropical areas, and has become a mildly invasive species in Hawaii, Seychelles, Ascension Island and the Society Islands.',
    image: 'https://images.pexels.com/photos/3097770/pexels-photo-3097770.jpeg?auto=compress&cs=tinysrgb&h=350',
    care: {
      light: 'Bright, indirect light',
      water: 'Allow soil to dry out between waterings',
      humidity: 'Medium to high',
      temperature: '65-85°F (18-29°C)',
      soil: 'Well-draining potting mix',
      fertilizer: 'Monthly during growing season',
    },
    difficulty: 'Easy',
    toxic: 'Mildly toxic to pets',
    propagation: 'Stem cuttings in water or soil',
    growth: 'Fast growing in optimal conditions',
  },
  snakePlant: {
    id: 'snakePlant',
    name: 'Snake Plant',
    commonNames: ['Mother-in-law\'s Tongue', 'Viper\'s Bowstring Hemp'],
    description: 'The Snake Plant is an evergreen perennial plant with stiff, upright leaves that may reach a height of several feet. This plant is popular for its hardiness and ability to survive in less-than-ideal conditions, making it perfect for beginners.',
    image: 'https://images.pexels.com/photos/2123482/pexels-photo-2123482.jpeg?auto=compress&cs=tinysrgb&h=350',
    care: {
      light: 'Low to bright light, tolerates low light',
      water: 'Let soil dry completely between waterings',
      humidity: 'Low to medium, tolerates dry air',
      temperature: '70-90°F (21-32°C)',
      soil: 'Well-draining, sandy soil mix',
      fertilizer: 'Sparingly, every 2-3 months in growing season',
    },
    difficulty: 'Very easy',
    toxic: 'Mildly toxic to pets and humans',
    propagation: 'Leaf cuttings or division',
    growth: 'Slow to moderate growth rate',
  },
  fiddleLeafFig: {
    id: 'fiddleLeafFig',
    name: 'Fiddle Leaf Fig',
    commonNames: ['Ficus Lyrata', 'Banjo Fig'],
    description: 'The Fiddle Leaf Fig is a species of flowering plant in the mulberry and fig family Moraceae. It is native to western Africa, from Cameroon west to Sierra Leone, where it grows in lowland tropical rainforest. It can grow up to 40 feet tall in its native habitat.',
    image: 'https://images.pexels.com/photos/4751978/pexels-photo-4751978.jpeg?auto=compress&cs=tinysrgb&h=350',
    care: {
      light: 'Bright, indirect light, some direct morning sun',
      water: 'Water when top inch of soil is dry',
      humidity: 'Medium to high',
      temperature: '60-75°F (15-24°C)',
      soil: 'Well-draining potting mix',
      fertilizer: 'Monthly during growing season',
    },
    difficulty: 'Moderate',
    toxic: 'Toxic to pets',
    propagation: 'Stem cuttings, air layering',
    growth: 'Moderate growth rate',
  },
  pothos: {
    id: 'pothos',
    name: 'Pothos',
    commonNames: ['Devil\'s Ivy', 'Golden Pothos', 'Money Plant'],
    description: 'Pothos is a genus of flowering plants in the family Araceae. Native to Southeast Asia and the Pacific, it\'s known for its heart-shaped leaves and trailing vines. It\'s one of the easiest houseplants to grow, making it popular for beginners and office settings.',
    image: 'https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&h=350',
    care: {
      light: 'Low to bright indirect light',
      water: 'Allow soil to dry between waterings',
      humidity: 'Low to medium, tolerates dry air',
      temperature: '65-85°F (18-29°C)',
      soil: 'Well-draining potting mix',
      fertilizer: 'Monthly during growing season',
    },
    difficulty: 'Very easy',
    toxic: 'Toxic to pets',
    propagation: 'Stem cuttings in water or soil',
    growth: 'Fast growing',
  },
};

export default function PlantDetail() {
  const params = useLocalSearchParams();
  const plantId = params.id as string;
  const plantName = params.name as string;
  
  // Find plant data based on name or id
  const getPlantData = () => {
    if (plantId) {
      return Object.values(plantData).find(p => p.id === plantId) || Object.values(plantData)[0];
    }
    return Object.values(plantData).find(p => 
      p.name.toLowerCase().includes(plantName?.toLowerCase() || '')
    ) || Object.values(plantData)[0];
  };
  
  const plant = getPlantData();
  const [isFavorite, setIsFavorite] = useState(false);
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Care level indicator component
  const CareLevelIndicator = ({ level, title }) => {
    const getLevelColor = () => {
      switch (level) {
        case 'low':
          return '#55668D';
        case 'medium':
          return '#FFC43D';
        case 'high':
          return '#3A8349';
        default:
          return '#BBBBBB';
      }
    };
    
    return (
      <View style={styles.careLevelContainer}>
        <Text style={[styles.careLevelTitle, { color: isDark ? '#BBBBBB' : '#555555' }]}>
          {title}
        </Text>
        <View style={styles.careLevelDots}>
          <View style={[
            styles.careLevelDot,
            { backgroundColor: level === 'low' || level === 'medium' || level === 'high' ? getLevelColor() : isDark ? '#333333' : '#DDDDDD' }
          ]} />
          <View style={[
            styles.careLevelDot,
            { backgroundColor: level === 'medium' || level === 'high' ? getLevelColor() : isDark ? '#333333' : '#DDDDDD' }
          ]} />
          <View style={[
            styles.careLevelDot,
            { backgroundColor: level === 'high' ? getLevelColor() : isDark ? '#333333' : '#DDDDDD' }
          ]} />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Plant image with gradient overlay */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: plant.image }} style={styles.image} />
          
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.4)']}
            style={styles.imageGradient}
          >
            {/* Header with back button and favorite */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ChevronLeft color="white" size={24} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={toggleFavorite}
              >
                <Heart 
                  color={isFavorite ? '#FF6B6B' : 'white'} 
                  fill={isFavorite ? '#FF6B6B' : 'none'}
                  size={24} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Plant name at the bottom of the image */}
            <View style={styles.imageTextContainer}>
              <Text style={styles.plantName}>{plant.name}</Text>
              <Text style={styles.commonNames}>{plant.commonNames.join(', ')}</Text>
            </View>
          </LinearGradient>
        </View>
        
        {/* Plant content */}
        <View style={styles.contentContainer}>
          {/* Quick actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}
              onPress={() => router.push('/plantCare')}
            >
              <Calendar color="#3A8349" size={20} />
              <Text style={[styles.actionText, { color: isDark ? '#E0E0E0' : '#283618' }]}>Care</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}
              onPress={() => router.push('/plantDiagnosis')}
            >
              <Info color="#3A8349" size={20} />
              <Text style={[styles.actionText, { color: isDark ? '#E0E0E0' : '#283618' }]}>Diagnose</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}
            >
              <Share2 color="#3A8349" size={20} />
              <Text style={[styles.actionText, { color: isDark ? '#E0E0E0' : '#283618' }]}>Share</Text>
            </TouchableOpacity>
          </View>
          
          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
              About
            </Text>
            <Text style={[styles.description, { color: isDark ? '#BBBBBB' : '#555555' }]}>
              {plant.description}
            </Text>
          </View>
          
          {/* Care level indicators */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
              Care Level
            </Text>
            
            <View style={styles.careLevels}>
              <CareLevelIndicator level="high" title="Light" />
              <CareLevelIndicator level="medium" title="Water" />
              <CareLevelIndicator level="medium" title="Humidity" />
            </View>
            
            <View style={[styles.careBox, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}>
              <View style={styles.careBoxRow}>
                <Text style={[styles.careBoxLabel, { color: isDark ? '#E0E0E0' : '#283618' }]}>
                  Difficulty:
                </Text>
                <Text style={[styles.careBoxValue, { color: isDark ? '#8EB69B' : '#3A8349' }]}>
                  {plant.difficulty}
                </Text>
              </View>
              
              <View style={styles.careBoxRow}>
                <Text style={[styles.careBoxLabel, { color: isDark ? '#E0E0E0' : '#283618' }]}>
                  Growth Rate:
                </Text>
                <Text style={[styles.careBoxValue, { color: isDark ? '#8EB69B' : '#3A8349' }]}>
                  {plant.growth}
                </Text>
              </View>
              
              <View style={styles.careBoxRow}>
                <Text style={[styles.careBoxLabel, { color: isDark ? '#E0E0E0' : '#283618' }]}>
                  Toxicity:
                </Text>
                <Text style={[styles.careBoxValue, { color: isDark ? '#E0E0E0' : '#D27D4C' }]}>
                  {plant.toxic}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Detailed care instructions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
              Care Instructions
            </Text>
            
            <View style={styles.careInstructions}>
              <View style={[styles.careItem, { backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' }]}>
                <View style={[styles.careIconContainer, { backgroundColor: isDark ? '#1A2A20' : '#E6F2E8' }]}>
                  <Sun color="#FFC43D" size={24} />
                </View>
                <View style={styles.careTextContainer}>
                  <Text style={[styles.careTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
                    Light
                  </Text>
                  <Text style={[styles.careText, { color: isDark ? '#BBBBBB' : '#555555' }]}>
                    {plant.care.light}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.careItem, { backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' }]}>
                <View style={[styles.careIconContainer, { backgroundColor: isDark ? '#1A2A20' : '#E6F2E8' }]}>
                  <Droplet color="#33A1FF" size={24} />
                </View>
                <View style={styles.careTextContainer}>
                  <Text style={[styles.careTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
                    Water
                  </Text>
                  <Text style={[styles.careText, { color: isDark ? '#BBBBBB' : '#555555' }]}>
                    {plant.care.water}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.careItem, { backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' }]}>
                <View style={[styles.careIconContainer, { backgroundColor: isDark ? '#1A2A20' : '#E6F2E8' }]}>
                  <Wind color="#88CCFF" size={24} />
                </View>
                <View style={styles.careTextContainer}>
                  <Text style={[styles.careTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
                    Humidity
                  </Text>
                  <Text style={[styles.careText, { color: isDark ? '#BBBBBB' : '#555555' }]}>
                    {plant.care.humidity}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.careItem, { backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' }]}>
                <View style={[styles.careIconContainer, { backgroundColor: isDark ? '#1A2A20' : '#E6F2E8' }]}>
                  <Thermometer color="#FF6B6B" size={24} />
                </View>
                <View style={styles.careTextContainer}>
                  <Text style={[styles.careTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
                    Temperature
                  </Text>
                  <Text style={[styles.careText, { color: isDark ? '#BBBBBB' : '#555555' }]}>
                    {plant.care.temperature}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Propagation section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
              Propagation
            </Text>
            <Text style={[styles.description, { color: isDark ? '#BBBBBB' : '#555555' }]}>
              {plant.propagation}
            </Text>
          </View>
          
          {/* Bottom buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: '#3A8349' }]}
              onPress={() => router.push('/addToCollection')}
            >
              <Text style={styles.primaryButtonText}>Add to My Collection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryButton, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}
              onPress={() => router.push('/plantCare')}
            >
              <Text style={[styles.secondaryButtonText, { color: '#3A8349' }]}>Set Care Reminders</Text>
            </TouchableOpacity>
          </View>
          
          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTextContainer: {
    maxWidth: '80%',
  },
  plantName: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  commonNames: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  contentContainer: {
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  careLevels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  careLevelContainer: {
    alignItems: 'center',
    width: '30%',
  },
  careLevelTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  careLevelDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  careLevelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  careBox: {
    padding: 16,
    borderRadius: 12,
  },
  careBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  careBoxLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  careBoxValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  careInstructions: {
    gap: 12,
  },
  careItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  careIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  careTextContainer: {
    flex: 1,
  },
  careTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  careText: {
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    marginVertical: 20,
    gap: 12,
  },
  primaryButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});