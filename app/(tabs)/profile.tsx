import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { User, Settings, Bell, CircleHelp as HelpCircle, Share2, Heart, LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const userProfile = {
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&h=350',
    plantCount: 12,
    streakDays: 7,
    level: 'Plant Explorer',
  };
  
  const menuItems = [
    {
      id: 'account',
      icon: <User size={24} color="#3A8349" />,
      title: 'Account Settings',
      screen: '/accountSettings',
    },
    {
      id: 'notifications',
      icon: <Bell size={24} color="#3A8349" />,
      title: 'Notifications',
      screen: '/notifications',
    },
    {
      id: 'help',
      icon: <HelpCircle size={24} color="#3A8349" />,
      title: 'Help & Support',
      screen: '/help',
    },
    {
      id: 'share',
      icon: <Share2 size={24} color="#3A8349" />,
      title: 'Share with Friends',
      screen: '/share',
    },
    {
      id: 'about',
      icon: <Heart size={24} color="#3A8349" />,
      title: 'About Leafy',
      screen: '/about',
    },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
            Profile
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Settings color={isDark ? '#E0E0E0' : '#283618'} size={24} />
        </TouchableOpacity>
      </View>
      
      <View style={[
        styles.profileCard,
        { backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' }
      ]}>
        <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
        
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: isDark ? '#E0E0E0' : '#283618' }]}>
            {userProfile.name}
          </Text>
          <Text style={[styles.profileEmail, { color: isDark ? '#BBBBBB' : '#555555' }]}>
            {userProfile.email}
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: isDark ? '#E0E0E0' : '#283618' }]}>
                {userProfile.plantCount}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? '#BBBBBB' : '#555555' }]}>
                Plants
              </Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#EEEEEE' }]} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: isDark ? '#E0E0E0' : '#283618' }]}>
                {userProfile.streakDays}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? '#BBBBBB' : '#555555' }]}>
                Day Streak
              </Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#EEEEEE' }]} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: isDark ? '#E0E0E0' : '#283618' }]}>
                {userProfile.level}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? '#BBBBBB' : '#555555' }]}>
                Level
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: isDark ? '#3A5042' : '#E6F2E8' }]}
          onPress={() => router.push('/editProfile')}
        >
          <Text style={[styles.editButtonText, { color: '#3A8349' }]}>
            Edit Profile
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              { backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' }
            ]}
            onPress={() => router.push(item.screen)}
          >
            <View style={styles.menuIconContainer}>
              {item.icon}
            </View>
            
            <Text style={[styles.menuText, { color: isDark ? '#E0E0E0' : '#283618' }]}>
              {item.title}
            </Text>
            
            <Text style={[styles.menuArrow, { color: isDark ? '#BBBBBB' : '#555555' }]}>
              &rsaquo;
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.logoutButton,
          { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }
        ]}
      >
        <LogOut size={24} color="#D27D4C" />
        <Text style={[styles.logoutText, { color: '#D27D4C' }]}>
          Log Out
        </Text>
      </TouchableOpacity>
      
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: isDark ? '#BBBBBB' : '#555555' }]}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
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
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 30,
  },
  editButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(58, 131, 73, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
  },
});