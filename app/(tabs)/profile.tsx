import React from 'react';
import {
	View,
	StyleSheet,
	Image,
	TouchableOpacity,
	ScrollView,
	useColorScheme,
	StatusBar,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
	Leaf,
	Bell,
	CircleHelp as HelpCircle,
	Share2,
	User,
	Heart,
	LogOut,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/app/constants/colors';
import { Text } from '@/components/Text';
import { usePlants } from '@/hooks/usePlants';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';
	const insets = useSafeAreaInsets();
	const { signOut, session } = useAuth();

	const { plants } = usePlants();
	const { profile, refreshProfile } = useProfile();

	useFocusEffect(
		React.useCallback(() => {
			refreshProfile();
		}, [refreshProfile])
	);

	const userProfile = {
		name: profile?.username ?? '-',
		email: session?.user?.email ?? '-',
		avatar: profile?.avatar_url ?? '',
		plantCount: plants?.length || 0,
		streakDays: '-',
		level: '-',
	};

	const menuItems = [
		{
			id: 'account',
			icon: <User size={20} color={COLORS.tabBar.active} />,
			title: 'Account Settings',
			onPress: () => router.push('/accountSettings'),
		},
		{
			id: 'help',
			icon: <HelpCircle size={20} color={COLORS.tabBar.active} />,
			title: 'Help & Support',
			onPress: () => router.push('/help'),
		},
		{
			id: 'share',
			icon: <Share2 size={20} color={COLORS.tabBar.active} />,
			title: 'Share with Friends',
			onPress: () => router.push('/share'),
		},
	];

	const handleLogout = async () => {
		try {
			await signOut();
			router.replace('/login');
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: isDark ? '#121212' : '#fff', paddingTop: insets.top + 8 },
			]}
		>
			<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
			{/* Header with inset spacing */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Leaf color={COLORS.tabBar.active} size={24} />
					<Text style={styles.headerTitle}>Profile</Text>
				</View>
			</View>

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View
					style={[
						styles.profileCard,
						{ backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' },
					]}
				>
					{!!userProfile?.avatar && (
						<View style={COLORS.shadowLg}>
							<Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
						</View>
					)}

					<Text style={[styles.profileName, { color: isDark ? '#E0E0E0' : '#283618' }]}>
						{userProfile.name}
					</Text>
					<Text style={[styles.profileEmail, { color: isDark ? '#BBBBBB' : '#555555' }]}>
						{userProfile.email}
					</Text>

					<View style={styles.statsContainer}>
						<View style={styles.statItem}>
							<Text
								style={[
									styles.statNumber,
									{ color: isDark ? '#E0E0E0' : '#283618' },
								]}
							>
								{userProfile.plantCount}
							</Text>
							<Text
								style={[
									styles.statLabel,
									{ color: isDark ? '#BBBBBB' : '#555555' },
								]}
							>
								Plants
							</Text>
						</View>
						<View
							style={[
								styles.divider,
								{ backgroundColor: isDark ? '#333333' : '#EEEEEE' },
							]}
						/>
						<View style={styles.statItem}>
							<Text
								style={[
									styles.statNumber,
									{ color: isDark ? '#E0E0E0' : '#283618' },
								]}
							>
								{userProfile.streakDays}
							</Text>
							<Text
								style={[
									styles.statLabel,
									{ color: isDark ? '#BBBBBB' : '#555555' },
								]}
							>
								Day Streak
							</Text>
						</View>
						<View
							style={[
								styles.divider,
								{ backgroundColor: isDark ? '#333333' : '#EEEEEE' },
							]}
						/>
						<View style={styles.statItem}>
							<Text
								style={[
									styles.statNumber,
									{ color: isDark ? '#E0E0E0' : '#283618' },
								]}
							>
								{userProfile.level}
							</Text>
							<Text
								style={[
									styles.statLabel,
									{ color: isDark ? '#BBBBBB' : '#555555' },
								]}
							>
								Level
							</Text>
						</View>
					</View>
				</View>

				<View style={styles.menuContainer}>
					{menuItems.map((item) => (
						<TouchableOpacity
							key={item.id}
							style={[
								styles.menuItem,
								{ backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' },
							]}
							onPress={item.onPress}
						>
							<View style={styles.menuIconContainer}>{item.icon}</View>
							<Text
								style={[styles.menuText, { color: isDark ? '#E0E0E0' : '#283618' }]}
							>
								{item.title}
							</Text>
							<Leaf
								size={16}
								color={COLORS.tabBar.inactive}
								style={{ transform: [{ rotate: '90deg' }] }}
							/>
						</TouchableOpacity>
					))}
				</View>

				<TouchableOpacity
					style={[
						styles.logoutButton,

						{ backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' },
					]}
					onPress={handleLogout}
				>
					<LogOut size={24} color={COLORS.warning} />
					<Text style={[styles.logoutText, { color: COLORS.warning }]}>Log Out</Text>
				</TouchableOpacity>

				<Text style={[styles.versionText, { color: isDark ? '#BBBBBB' : '#555555' }]}>
					Version 1.0.0
				</Text>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		marginBottom: 8,
		backgroundColor: '#fff',
	},
	headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },

	scrollContent: { padding: 16, paddingBottom: 40 },
	profileCard: {
		borderRadius: 16,
		padding: 20,
		alignItems: 'center',
		marginBottom: 24,
		borderWidth: 2,
		borderColor: COLORS.border,
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 14,
		marginBottom: 12,
	},
	profileName: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
	profileEmail: { fontSize: 14, marginBottom: 12 },
	statsContainer: {
		flexDirection: 'row',
		width: '100%',
		justifyContent: 'space-around',
		marginBottom: 16,
	},
	statItem: { alignItems: 'center' },
	statNumber: { fontSize: 18, fontWeight: '700' },
	statLabel: { fontSize: 12, marginTop: 4 },
	divider: { width: 1, height: 30 },
	editButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	editButtonText: { fontSize: 14, fontWeight: '600' },

	menuContainer: { marginBottom: 24 },
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		marginBottom: 8,
		borderWidth: 2,
		borderColor: COLORS.border,
	},
	menuIconContainer: {
		width: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
		backgroundColor: 'rgba(58, 131, 73, 0.1)',
		borderRadius: 16,
	},
	menuText: { flex: 1, fontSize: 16, fontWeight: '500' },
	logoutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
		borderRadius: 12,
		marginBottom: 24,
		borderWidth: 2,
		borderColor: COLORS.border,
		color: COLORS.warning,
	},
	logoutText: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
	versionText: { textAlign: 'center', fontSize: 12, marginBottom: 16 },
});
