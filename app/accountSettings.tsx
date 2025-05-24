import React, { useEffect, useState, useRef } from 'react';
import {
	View,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	Platform,
	KeyboardAvoidingView,
	ScrollView,
	Animated,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, User, Mail, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { COLORS } from './constants/colors';
import { Text } from '@/components/Text';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRevenuecat } from '@/hooks/useRevenuecat';

export default function AccountSettingsScreen() {
	const insets = useSafeAreaInsets();
	const { profile, updateProfile, refreshProfile } = useProfile();
	const { session } = useAuth();
	const { proAction } = useRevenuecat({ offering: 'pips' });

	const [username, setUsername] = useState(profile?.username || '');
	const [email, setEmail] = useState(session?.user?.email || '');
	const [loading, setLoading] = useState(false);
	const [hasError, setHasError] = useState(false);

	const shakeAnimation = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (profile) {
			setUsername(profile.username ?? '');
			setEmail(session?.user?.email ?? '');
		}
	}, [profile]);

	const shake = () => {
		Animated.sequence([
			Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
			Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
			Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
			Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
		]).start();
	};

	const handleSave = async () => {
		proAction(async () => {
			if (!username.trim()) {
				setHasError(true);
				shake();
				return;
			}
			try {
				setLoading(true);
				await updateProfile({ username });
				await refreshProfile();
				router.back();
			} catch {
				Alert.alert('Error', 'Failed to update profile');
			} finally {
				setLoading(false);
			}
		});
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
						const {
							data: { session: s },
						} = await supabase.auth.getSession();
						if (!s) return;
						const token = s.access_token;
						try {
							const response = await fetch(
								'https://kvjaxrtgtjbqopegbshw.supabase.co/functions/v1/delete-account',
								{
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
										Authorization: `Bearer ${token}`,
									},
									body: JSON.stringify({ user_id: s.user.id }),
								}
							);
							const data = await response.json();
							if (!data.error) {
								await AsyncStorage.clear();
								await supabase.auth.signOut();
								router.push('/');
							}
						} catch {}
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
				<Text style={styles.sectionTitle}>Profile Information</Text>
				<Animated.View
					style={[
						styles.inputWrapper,
						{
							transform: [{ translateX: shakeAnimation }],
							borderColor: hasError ? COLORS.error : COLORS.border,
						},
					]}
				>
					<User size={20} color={COLORS.text.secondary.light} />
					<TextInput
						style={styles.input}
						placeholder="Username"
						value={username}
						onChangeText={(t) => {
							setUsername(t);
							if (t.trim()) setHasError(false);
						}}
						placeholderTextColor={COLORS.text.secondary.light}
					/>
				</Animated.View>
				{hasError && <Text style={styles.errorText}>Username is required.</Text>}

				<Text style={[styles.sectionTitle, { marginTop: 24 }]}>Contact</Text>
				<View style={[styles.inputWrapper, { opacity: 0.5 }]}>
					<Mail size={20} color={COLORS.text.secondary.light} />
					<TextInput
						style={styles.input}
						placeholder="Email"
						value={email}
						editable={false}
						placeholderTextColor={COLORS.text.secondary.light}
					/>
				</View>

				{/* Danger Zone at bottom of scroll */}
				<View style={styles.dangerZoneContainer}>
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

			{/* Sticky Save Button */}
			<View style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}>
				<Button onPress={handleSave} loading={loading} disabled={loading} fullWidth>
					Save Changes
				</Button>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#fff' },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	backButton: { padding: 8, marginRight: 8 },
	headerTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text.primary.light },
	content: { flex: 1, padding: 16 },
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: COLORS.text.primary.light,
		marginBottom: 8,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: 8,
		paddingHorizontal: 12,
		height: 48,
		marginBottom: 8,
	},
	input: { flex: 1, marginLeft: 8, fontSize: 16, color: COLORS.text.primary.light },
	errorText: { color: COLORS.error, fontSize: 12, marginBottom: 8 },
	dangerZoneContainer: {
		marginTop: 32,
		marginBottom: 16,
	},
	deleteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FEE2E2',
		padding: 16,
		borderRadius: 8,
	},
	deleteButtonText: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: COLORS.error },
	footer: {
		borderTopWidth: 1,
		borderTopColor: COLORS.border,
		padding: 16,
		backgroundColor: '#fff',
	},
});
