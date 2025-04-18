import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  useColorScheme,
  Platform,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Search, ArrowRight, CircleArrowRight as ArrowRightCircle, Sun, Droplet, CircleAlert as AlertCircle, Camera, Calendar } from 'lucide-react-native';
import { PlantCard } from '@/components/PlantCard';
import { RecentPlant } from '@/components/RecentPlant';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [greeting, setGreeting] = useState('');
  const windowWidth = Dimensions.get('window').width;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const upcomingCare = [
    { id: '1', name: 'Snake Plant', action: 'Water', due: 'Today', image: 'https://images.pexels.com/photos/2123482/pexels-photo-2123482.jpeg?auto=compress&cs=tinysrgb&h=350' },
    { id: '2', name: 'Monstera', action: 'Mist', due: 'Tomorrow', image: 'https://images.pexels.com/photos/3097770/pexels-photo-3097770.jpeg?auto=compress&cs=tinysrgb&h=350' },
  ];

  const recentlyIdentified = [
    { id: '1', name: 'Fiddle Leaf Fig', date: '2 days ago', image: 'https://images.pexels.com/photos/4751978/pexels-photo-4751978.jpeg?auto=compress&cs=tinysrgb&h=350' },
    { id: '2', name: 'Pothos', date: '5 days ago', image: 'https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&h=350' },
  ];

  const plantHealthAlerts = [
    { id: '1', plant: 'Monstera', issue: 'Yellow leaves' },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={isDark ? ['#1F3025', '#121212'] : ['#E6F2E8', '#F5F5F5']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: isDark ? '#E0E0E0' : '#283618' }]}>
              {greeting}, Plant Lover
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#BBBBBB' : '#555555' }]}>
              Let's check on your green friends
            </Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Search color={isDark ? '#E0E0E0' : '#283618'} size={24} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}
          onPress={() => router.push('/(tabs)/identify')}
        >
          <View style={[styles.iconContainer, { backgroundColor: isDark ? '#3A5042' : '#CAE1D1' }]}>
            <Camera color="#3A8349" size={24} />
          </View>
          <Text style={[styles.actionText, { color: isDark ? '#E0E0E0' : '#283618' }]}>Identify</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}
          onPress={() => router.push('/(tabs)/care')}
        >
          <View style={[styles.iconContainer, { backgroundColor: isDark ? '#3A5042' : '#CAE1D1' }]}>
            <Calendar color="#3A8349" size={24} />
          </View>
          <Text style={[styles.actionText, { color: isDark ? '#E0E0E0' : '#283618' }]}>Care</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}
          onPress={() => router.push('/lightMeter')}
        >
          <View style={[styles.iconContainer, { backgroundColor: isDark ? '#3A5042' : '#CAE1D1' }]}>
            <Sun color="#3A8349" size={24} />
          </View>
          <Text style={[styles.actionText, { color: isDark ? '#E0E0E0' : '#283618' }]}>Light</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Care */}
      {upcomingCare.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
              Today's Plant Care
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/care')}>
              <Text style={[styles.seeAll, { color: isDark ? '#8EB69B' : '#3A8349' }]}>
                See all
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.careCards}>
            {upcomingCare.map(plant => (
              <PlantCard 
                key={plant.id}
                name={plant.name}
                action={plant.action}
                due={plant.due}
                image={plant.image}
                isDark={isDark}
                onPress={() => router.push({
                  pathname: '/plantDetail',
                  params: { id: plant.id, name: plant.name }
                })}
              />
            ))}
          </View>
        </View>
      )}

      {/* Recently Identified */}
      {recentlyIdentified.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
              Recently Identified
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/collection')}>
              <Text style={[styles.seeAll, { color: isDark ? '#8EB69B' : '#3A8349' }]}>
                See all
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.recentScroll}
            contentContainerStyle={styles.recentScrollContent}
          >
            {recentlyIdentified.map(plant => (
              <RecentPlant
                key={plant.id}
                name={plant.name}
                date={plant.date}
                image={plant.image}
                isDark={isDark}
                onPress={() => router.push({
                  pathname: '/plantDetail',
                  params: { id: plant.id, name: plant.name }
                })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Plant Health Alerts */}
      {plantHealthAlerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
              Health Alerts
            </Text>
          </View>
          
          {plantHealthAlerts.map(alert => (
            <TouchableOpacity 
              key={alert.id}
              style={[styles.alertCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFE8E0' }]}
              onPress={() => router.push({
                pathname: '/plantDiagnosis',
                params: { plantId: alert.id, issue: alert.issue }
              })}
            >
              <AlertCircle color="#D27D4C" size={24} />
              <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
                  {alert.plant}: {alert.issue}
                </Text>
                <Text style={[styles.alertSubtitle, { color: isDark ? '#BBBBBB' : '#555555' }]}>
                  Tap to diagnose and treat
                </Text>
              </View>
              <ArrowRightCircle color={isDark ? '#8EB69B' : '#3A8349'} size={24} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Bottom padding for scrolling */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    zIndex: 1,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    width: '30%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  careCards: {
    gap: 12,
  },
  recentScroll: {
    marginLeft: -5,
  },
  recentScrollContent: {
    paddingLeft: 5,
    paddingRight: 20,
    paddingBottom: 10,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  alertSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  bottomPadding: {
    height: 40,
  },
});