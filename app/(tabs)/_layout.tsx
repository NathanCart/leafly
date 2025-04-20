// TabLayout.tsx

import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
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
import { COLORS } from '../constants/colors';

function CustomTabBarButton(props: BottomTabBarButtonProps) {
	const { children, onPress, accessibilityState, style, ...rest } = props;
	const scale = useRef(new Animated.Value(1)).current;

	const bounce = () => {
		scale.setValue(1);
		Animated.sequence([
			Animated.spring(scale, {
				toValue: 1.15,
				friction: 3,
				useNativeDriver: true,
			}),
			Animated.spring(scale, {
				toValue: 1,
				friction: 3,
				useNativeDriver: true,
			}),
		]).start();
	};

	// always bounce on tap
	const handlePress = () => {
		bounce();
		onPress?.();
	};

	// *Optional*: also bounce when the tab becomes focused by swiping or programmatically
	useEffect(() => {
		if (accessibilityState?.selected) {
			bounce();
		}
	}, [accessibilityState?.selected]);

	return (
		<TouchableOpacity {...rest} onPress={handlePress} style={style} activeOpacity={1}>
			<Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
				{children}
			</Animated.View>
		</TouchableOpacity>
	);
}

export default function TabLayout() {
	const isDark = useColorScheme() === 'dark';

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
					// keep the “plus” screen’s own behavior
					tabBarStyle: { display: 'none' },
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
