import React, { useEffect, useState } from 'react';
import {
	View,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	Platform,
	KeyboardAvoidingView,
	ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, User, Mail, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { COLORS } from './constants/colors';
import { Text } from '@/components/Text';
import { opacity } from 'react-native-reanimated/lib/typescript/Colors';

export default function AccountSettingsScreen() {
	const insets = useSafeAreaInsets();
	const { profile, updateProfile, refreshProfile } = useProfile();
	const { signOut } = useAuth();

	console.log(profile, 'profile data');
	const [username, setUsername] = useState(profile?.username || '');
	const { session } = useAuth();
	const [email, setEmail] = useState(session?.user?.email || '');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (profile) {
			setUsername(profile?.username ?? '');
			setEmail(session?.user?.email ?? '');
		}
	}, [profile]);

	const handleSave = async () => {
		try {
			setLoading(true);
			router.back();

			await updateProfile({
				username,
			});
		} catch (error) {
			Alert.alert('Error', 'Failed to update profile');
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteAccount = () => {
		Alert.alert(
			'Delete Account',
			'Are you sure you want to delete your account? This action cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							setLoading(true);
							await signOut();
							router.replace('/login');
						} catch (error) {
							Alert.alert('Error', 'Failed to delete account');
						} finally {
							setLoading(false);
						}
					},
				},
			]
		);
	};

	return (
		<KeyboardAvoidingView
			style={[styles.container, { paddingTop: insets.top }]}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
					<ChevronLeft size={24} color={COLORS.text.primary.light} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Account Settings</Text>
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Profile Information</Text>
					<View style={styles.inputContainer}>
						<View style={styles.inputWrapper}>
							<User size={20} color={COLORS.text.secondary.light} />
							<TextInput
								style={styles.input}
								placeholder="Username"
								value={username}
								onChangeText={setUsername}
								placeholderTextColor={COLORS.text.secondary.light}
							/>
						</View>
					</View>

					<View style={[styles.inputContainer, { opacity: 0.5 }]}>
						<View style={styles.inputWrapper}>
							<Mail size={20} color={COLORS.text.secondary.light} />
							<TextInput
								readOnly
								style={[styles.input]}
								placeholder="Email"
								value={email}
								onChangeText={setEmail}
								keyboardType="email-address"
								autoCapitalize="none"
								placeholderTextColor={COLORS.text.secondary.light}
							/>
						</View>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Danger Zone</Text>
					<TouchableOpacity
						style={styles.deleteButton}
						onPress={handleDeleteAccount}
						disabled={loading}
					>
						<Trash2 size={20} color={COLORS.error} />
						<Text style={styles.deleteButtonText}>Delete Account</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>

			<View style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}>
				<Button onPress={handleSave} loading={loading} disabled={loading} fullWidth>
					Save Changes
				</Button>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	backButton: {
		padding: 8,
		marginRight: 8,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: COLORS.text.primary.light,
	},
	content: {
		flex: 1,
		padding: 16,
	},
	section: {
		flex: 1,
		marginTop: 'auto',
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: COLORS.text.primary.light,
		marginBottom: 16,
	},
	inputContainer: {
		marginBottom: 16,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: 8,
		paddingHorizontal: 12,
		height: 48,
	},
	input: {
		flex: 1,
		marginLeft: 8,
		fontSize: 16,
		color: COLORS.text.primary.light,
	},
	deleteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FEE2E2',
		padding: 16,
		borderRadius: 8,
	},
	deleteButtonText: {
		marginLeft: 8,
		fontSize: 16,
		fontWeight: '600',
		color: COLORS.error,
	},
	footer: {
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: COLORS.border,
	},
});
