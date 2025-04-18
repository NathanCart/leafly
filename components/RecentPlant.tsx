import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

interface RecentPlantProps {
  name: string;
  date: string;
  image: string;
  isDark: boolean;
  onPress: () => void;
}

export function RecentPlant({ name, date, image, isDark, onPress }: RecentPlantProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' }
      ]}
      onPress={onPress}
    >
      <Image source={{ uri: image }} style={styles.image} />
      
      <View style={styles.overlay}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.date}>
          {date}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
  },
  name: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
});