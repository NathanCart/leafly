import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  useWindowDimensions,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Sun, Droplet, Wind, ThermometerSun, ChevronDown, MapPin } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { PlantIdentificationResult } from '@/types/plants';
import { COLORS } from '@/app/constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  plant: PlantIdentificationResult | null;
  onConfirm: () => void;
  isDark: boolean;
}

export function PlantDetailsModal({ visible, onClose, plant, onConfirm, isDark }: Props) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const descriptionAnimation = useRef(new Animated.Value(0)).current;
  const { width: windowWidth } = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const toggleDescription = () => {
    const toValue = isDescriptionExpanded ? 0 : 1;
    setIsDescriptionExpanded(!isDescriptionExpanded);
    
    Animated.spring(descriptionAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
  };

  const rotateIcon = descriptionAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, 150],
    extrapolate: 'clamp',
  });

  if (!plant) return null;

  const description = plant.description;
  const shouldTruncate = description.length > 100;
  const truncatedText = shouldTruncate && !isDescriptionExpanded 
    ? description.substring(0, 100) + '...'
    : description;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)' }]}>
        <StatusBar barStyle="light-content" />
        <TouchableOpacity
          style={[
            styles.closeButton,
            { top: Platform.OS === 'ios' ? insets.top + 10 : 20 }
          ]}
          onPress={onClose}
        >
          <X color="white" size={24} />
        </TouchableOpacity>

        <Animated.ScrollView
          style={styles.scrollView}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.imageContainer}>
            <Animated.Image
              source={{ uri: plant.imageUri }}
              style={[
                styles.image,
                {
                  width: windowWidth,
                  transform: [{ translateY: imageTranslateY }]
                }
              ]}
            />
          </View>

          <View style={[
            styles.content,
            {
              backgroundColor: isDark ? '#121212' : '#FFFFFF',
              marginTop: -20,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }
          ]}>
            <View style={styles.locationBadge}>
              <View style={[
                styles.locationContainer,
                { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }
              ]}>
                <MapPin size={16} color={COLORS.primary} />
                <Text style={[
                  styles.locationText,
                  { color: isDark ? '#E0E0E0' : '#283618' }
                ]}>
                  {plant.location} Plant
                </Text>
              </View>
            </View>

            <View style={styles.titleContainer}>
              <View style={styles.titleWrapper}>
                <Text style={[styles.title, { color: isDark ? '#FFF' : '#000' }]} numberOfLines={2}>
                  {plant.name}
                </Text>
                <Text style={[styles.subtitle, { color: isDark ? '#BBB' : '#666' }]} numberOfLines={1}>
                  {plant.scientificName}
                </Text>
              </View>
              <View style={[styles.confidenceTag, { backgroundColor: COLORS.success }]}>
                <Text style={styles.confidenceText}>
                  {Math.round(plant.confidence * 100)}%
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#000' }]}>
                About
              </Text>
              <View style={styles.descriptionContainer}>
                <Text style={[styles.description, { color: isDark ? '#BBB' : '#666' }]}>
                  {truncatedText}
                </Text>
                {shouldTruncate && (
                  <TouchableOpacity 
                    style={styles.readMoreButton} 
                    onPress={toggleDescription}
                  >
                    <Text style={[styles.readMoreText, { color: COLORS.primary }]}>
                      {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                    </Text>
                    <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
                      <ChevronDown color={COLORS.primary} size={20} />
                    </Animated.View>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#000' }]}>
                Care Requirements
              </Text>
              <View style={styles.careGrid}>
                <View style={[styles.careItem, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
                  <Sun color={COLORS.warning} size={24} />
                  <Text style={[styles.careLabel, { color: isDark ? '#FFF' : '#000' }]}>
                    {plant.careInstructions?.light}
                  </Text>
                </View>
                <View style={[styles.careItem, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
                  <Droplet color={COLORS.info} size={24} />
                  <Text style={[styles.careLabel, { color: isDark ? '#FFF' : '#000' }]}>
                    {plant.careInstructions?.water}
                  </Text>
                </View>
                <View style={[styles.careItem, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
                  <Wind color={COLORS.primary} size={24} />
                  <Text style={[styles.careLabel, { color: isDark ? '#FFF' : '#000' }]}>
                    {plant.careInstructions?.humidity || 'Moderate humidity'}
                  </Text>
                </View>
                <View style={[styles.careItem, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
                  <ThermometerSun color={COLORS.error} size={24} />
                  <Text style={[styles.careLabel, { color: isDark ? '#FFF' : '#000' }]}>
                    {plant.careInstructions?.temperature}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                onPress={onConfirm}
                fullWidth
                size="large"
              >
                Add to My Collection
              </Button>
              <Button
                onPress={onClose}
                variant="secondary"
                fullWidth
                style={{ marginTop: 12 }}
              >
                Back to Results
              </Button>
            </View>
          </View>
        </Animated.ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 400,
    overflow: 'hidden',
  },
  image: {
    height: 500,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    padding: 20,
    minHeight: '100%',
  },
  locationBadge: {
    alignItems: 'center',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  descriptionContainer: {
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  confidenceTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  confidenceText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  careGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  careItem: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  careLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
  },
});