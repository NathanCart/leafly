import React, { useState } from 'react';
import {
	View,
	TextInput,
	StyleSheet,
	useColorScheme,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Leaf, Mail, Lock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { COLORS } from '@/app/constants/colors';
import { Text } from '@/components/Text';

export default function LoginScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { signIn } = useAuth();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';

	const handleLogin = async () => {
		if (!email || !password) {
			setError('Please fill in all fields');
			return;
		}

		try {
			setLoading(true);
			setError(null);
			await signIn(email, password);
			router.replace('/(tabs)');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to sign in');
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
				<View style={styles.header}>
					<View
						style={[
							styles.logoContainer,
							{ backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' },
						]}
					>
						<Leaf color={COLORS.primary} size={40} />
					</View>
					<Text style={[styles.title, { color: isDark ? '#E0E0E0' : '#283618' }]}>
						Welcome Back
					</Text>
					<Text style={[styles.subtitle, { color: isDark ? '#BBBBBB' : '#555555' }]}>
						Sign in to continue caring for your plants
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

					<Button
						onPress={handleLogin}
						loading={loading}
						disabled={loading}
						fullWidth
						size="large"
					>
						Sign In
					</Button>
				</View>

				<View style={styles.footer}>
					<Text style={[styles.footerText, { color: isDark ? '#BBBBBB' : '#555555' }]}>
						Don't have an account?
					</Text>
					<Button
						variant="tertiary"
						onPress={() => router.push('/register')}
						size="small"
					>
						Sign Up
					</Button>
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
});
