import React, { useState } from 'react';
import {
	View,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	useColorScheme,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Leaf, Mail, Lock, User, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Text } from '@/components/Text';
import { COLORS } from '../constants/colors';

export default function RegisterScreen() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { signUp } = useAuth();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';

	const handleRegister = async () => {
		if (!username || !email || !password) {
			setError('Please fill in all fields');
			return;
		}

		try {
			setLoading(true);
			setError(null);

			// Check if username is already taken
			const { data: existingUser, error: checkError } = await supabase
				.from('profiles')
				.select('username')
				.eq('username', username)
				.single();

			if (existingUser) {
				throw new Error('Username is already taken');
			}

			if (checkError && checkError.code !== 'PGRST116') {
				throw checkError;
			}

			// 1. Sign up with Supabase Auth
			const { data: authData, error: signUpError } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						username,
						email,
					},
				},
			});

			if (signUpError) throw signUpError;
			if (!authData.user) throw new Error('Registration failed');

			// 2. Create profile in the database
			const { error: profileError } = await supabase.from('profiles').insert([
				{
					id: authData.user.id,
					username,
					email,
					updated_at: new Date().toISOString(),
				},
			]);

			if (profileError) {
				// If profile creation fails, clean up the auth account
				await supabase.auth.signOut();
				throw profileError;
			}

			// 3. Sign in automatically
			await signUp(email, password);

			// 4. Navigate to home screen
			router.replace('/(tabs)');
		} catch (err) {
			let errorMessage = 'Failed to sign up';

			if (err instanceof Error) {
				if (err.message.includes('User already registered')) {
					errorMessage = 'This email is already registered';
				} else if (err.message === 'Username is already taken') {
					errorMessage = err.message;
				} else if (err.message.includes('duplicate key')) {
					errorMessage = 'This username is already taken';
				} else {
					errorMessage = err.message;
				}
			}

			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<View style={styles.content}>
				<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
					<ChevronLeft color={isDark ? '#E0E0E0' : '#283618'} size={24} />
				</TouchableOpacity>

				<View style={styles.header}>
					<View
						style={[
							styles.logoContainer,
							{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
						]}
					>
						<Leaf color="#3A8349" size={40} />
					</View>
					<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
						Create Account
					</Text>
					<Text style={[styles.subtitle, { color: isDark ? '#BBBBBB' : '#555555' }]}>
						Join our community of plant lovers
					</Text>
				</View>

				{error && (
					<View
						style={[
							styles.errorContainer,
							{ backgroundColor: isDark ? '#2A2A2A' : '#FFE8E0' },
						]}
					>
						<Text style={[styles.errorText, { color: isDark ? '#FFB4A1' : '#D27D4C' }]}>
							{error}
						</Text>
					</View>
				)}

				<View style={styles.form}>
					<View style={styles.inputContainer}>
						<View
							style={[
								styles.input,
								{ backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' },
							]}
						>
							<User color={isDark ? '#BBBBBB' : '#999999'} size={20} />
							<TextInput
								style={[
									styles.inputText,
									{ color: isDark ? '#E0E0E0' : '#283618' },
								]}
								placeholder="Username"
								placeholderTextColor={isDark ? '#BBBBBB' : '#999999'}
								value={username}
								onChangeText={setUsername}
								autoCapitalize="none"
							/>
						</View>
					</View>

					<View style={styles.inputContainer}>
						<View
							style={[
								styles.input,
								{ backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' },
							]}
						>
							<Mail color={isDark ? '#BBBBBB' : '#999999'} size={20} />
							<TextInput
								style={[
									styles.inputText,
									{ color: isDark ? '#E0E0E0' : '#283618' },
								]}
								placeholder="Email"
								placeholderTextColor={isDark ? '#BBBBBB' : '#999999'}
								value={email}
								onChangeText={setEmail}
								autoCapitalize="none"
								keyboardType="email-address"
							/>
						</View>
					</View>

					<View style={styles.inputContainer}>
						<View
							style={[
								styles.input,
								{ backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' },
							]}
						>
							<Lock color={isDark ? '#BBBBBB' : '#999999'} size={20} />
							<TextInput
								style={[
									styles.inputText,
									{ color: isDark ? '#E0E0E0' : '#283618' },
								]}
								placeholder="Password"
								placeholderTextColor={isDark ? '#BBBBBB' : '#999999'}
								value={password}
								onChangeText={setPassword}
								secureTextEntry
							/>
						</View>
					</View>

					<TouchableOpacity
						style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
						onPress={handleRegister}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="white" />
						) : (
							<Text style={styles.buttonText}>Create Account</Text>
						)}
					</TouchableOpacity>
				</View>

				<View style={styles.footer}>
					<Text style={[styles.footerText, { color: isDark ? '#BBBBBB' : '#555555' }]}>
						Already have an account?
					</Text>
					<TouchableOpacity onPress={() => router.push('/login')}>
						<Text style={[styles.footerLink, { color: '#3A8349' }]}>Sign In</Text>
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		padding: 20,
		justifyContent: 'center',
	},
	backButton: {
		position: 'absolute',
		top: Platform.OS === 'ios' ? 60 : 20,
		left: 20,
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	header: {
		alignItems: 'center',
		marginBottom: 40,
	},
	logoContainer: {
		width: 80,
		height: 80,
		borderRadius: 40,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		textAlign: 'center',
	},
	errorContainer: {
		padding: 16,
		borderRadius: 12,
		marginBottom: 20,
	},
	errorText: {
		fontSize: 14,
		textAlign: 'center',
	},
	form: {
		gap: 16,
	},
	inputContainer: {
		gap: 8,
	},
	input: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 50,
		borderRadius: 12,
		paddingHorizontal: 16,
		gap: 12,
		borderWidth: 2,
		borderColor: COLORS.border,
	},
	inputText: {
		flex: 1,
		fontSize: 16,
	},
	button: {
		height: 50,
		backgroundColor: '#3A8349',
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 8,
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 32,
		gap: 8,
	},
	footerText: {
		fontSize: 14,
	},
	footerLink: {
		fontSize: 14,
		fontWeight: '600',
	},
});
