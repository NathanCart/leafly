// TabLayout.tsx

import React, { useRef, useEffect } from 'react';
import { router, Tabs } from 'expo-router';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import {
	LayoutGrid,
	LayoutGrid as LayoutGridIcon,
	Leaf,
	Leaf as LeafIcon,
	Plus,
	ClipboardList,
	ClipboardCheck,
	User,
	User as UserIcon,
} from 'lucide-react-native';
import {
	useColorScheme,
	View,
	StyleSheet,
	Platform,
	Animated,
	TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

function CustomTabBarButton(props: BottomTabBarButtonProps) {
	const { children, onPress, accessibilityState, style, ...rest } = props;
	const scale = useRef(new Animated.Value(1)).current;

	// Optional: bounce when tab is selected programmatically or by swipe

	const handlePressIn = () => {
		// animate inward
		Animated.spring(scale, {
			toValue: 0.85,
			friction: 5,
			tension: 100,
			useNativeDriver: true,
		}).start();
		// heavier haptic feedback
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	};

	const handlePressOut = () => {
		// animate back out
		Animated.spring(scale, {
			toValue: 1,
			friction: 5,
			tension: 100,
			useNativeDriver: true,
		}).start();
	};

	const handlePress = () => {
		onPress?.();
	};

	return (
		<TouchableOpacity
			{...rest}
			style={style}
			activeOpacity={1}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			onPress={handlePress}
		>
			<Animated.View style={[styles.tabButton, { transform: [{ scale }] }]}>
				{children}
			</Animated.View>
		</TouchableOpacity>
	);
}

export default function TabLayout() {
	const isDark = useColorScheme() === 'dark';

	useEffect(() => {
		(async () => {
			const installUUID = await AsyncStorage.getItem('install_uuid');
			const { data: session } = await supabase.auth.getSession();

			if (!installUUID?.length) return null;

			const { status: existingStatus } = await Notifications.getPermissionsAsync();

			let expoPushToken: string | null = null;
			console.log('testing 1');
			const projectId =
				Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
			if (!projectId) {
				return { error: 'Project ID not found' };
			}
			try {
				const pushTokenString = (
					await Notifications.getExpoPushTokenAsync({
						projectId,
					})
				).data;
				expoPushToken = pushTokenString;
			} catch (e: unknown) {
				console.error('Error getting push token:', e);
			}
			if (existingStatus === 'granted' && !!expoPushToken?.length) {
				console.log(installUUID, 'installUUID');
				const { data, error } = await supabase
					.from('user_notifications')
					.upsert([
						{
							id: installUUID,
							user_id: session?.session?.user?.id ?? null,
							expo_push_token: expoPushToken,
						},
					])
					.select()
					.single();
			}
		})();
	}, []);

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: COLORS.tabBar.active,
				tabBarInactiveTintColor: COLORS.tabBar.inactive,
				tabBarStyle: {
					backgroundColor: isDark
						? COLORS.tabBar.background.dark
						: COLORS.tabBar.background.light,
					height: Platform.OS === 'ios' ? 70 : 68,
					paddingBottom: Platform.OS === 'ios' ? 30 : 12,
					paddingTop: 12,
					borderTopWidth: 0,
					elevation: 8,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: -2 },
					shadowOpacity: 0.1,
					shadowRadius: 4,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Home',
					tabBarIcon: ({ color, focused }) =>
						focused ? (
							<LayoutGridIcon fill={color} color={color} size={24} />
						) : (
							<LayoutGrid color={color} size={24} />
						),
					tabBarButton: (props) => <CustomTabBarButton {...props} />,
				}}
			/>
			<Tabs.Screen
				name="collection"
				options={{
					title: 'My Plants',

					tabBarIcon: ({ color, focused }) =>
						focused ? (
							<LeafIcon fill={color} color={color} size={24} />
						) : (
							<Leaf color={color} size={24} />
						),
					tabBarButton: (props) => <CustomTabBarButton {...props} />,
				}}
			/>
			<Tabs.Screen
				name="identify"
				options={{
					href: null,
					tabBarStyle: { display: 'none' },
				}}
			/>
			<Tabs.Screen
				name="identifyOptions"
				options={{
					title: '',
					tabBarIcon: () => (
						<View style={styles.plusButtonContainer}>
							<View
								style={[
									styles.plusButton,
									{ backgroundColor: COLORS.button.primary },
								]}
							>
								<Plus color="white" size={32} />
							</View>
						</View>
					),
					tabBarButton: (props) => (
						<CustomTabBarButton
							{...props}
							onPress={() => {
								router.push('/identifyOptions');
							}}
						/>
					),
				}}
			/>

			<Tabs.Screen
				name="care"
				options={{
					title: 'Care',
					tabBarIcon: ({ color, focused }) =>
						focused ? (
							<ClipboardCheck fill={color} color={color} size={24} />
						) : (
							<ClipboardList color={color} size={24} />
						),
					tabBarButton: (props) => <CustomTabBarButton {...props} />,
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: 'Profile',
					tabBarIcon: ({ color, focused }) =>
						focused ? (
							<UserIcon fill={color} color={color} size={24} />
						) : (
							<User color={color} size={24} />
						),
					tabBarButton: (props) => <CustomTabBarButton {...props} />,
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	tabButton: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	plusButtonContainer: {
		position: 'absolute',
		top: -20,
		alignItems: 'center',
		justifyContent: 'center',
		width: 70,
		height: 70,
	},
	plusButton: {
		width: 60,
		height: 60,
		borderRadius: 30,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
});
