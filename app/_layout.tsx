import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useFonts } from '@expo-google-fonts/quicksand/useFonts';
import { Quicksand_300Light } from '@expo-google-fonts/quicksand/300Light';
import { Quicksand_400Regular } from '@expo-google-fonts/quicksand/400Regular';
import { Quicksand_500Medium } from '@expo-google-fonts/quicksand/500Medium';
import { Quicksand_600SemiBold } from '@expo-google-fonts/quicksand/600SemiBold';
import { Quicksand_700Bold } from '@expo-google-fonts/quicksand/700Bold';
import { View } from 'react-native';
import 'react-native-get-random-values';
import { TourProvider } from '@/contexts/TourContext';

function RootLayoutNav() {
	const { session, loading } = useAuth();
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;

		const inAuthGroup = segments[0] === '(auth)';

		if (!session && !inAuthGroup) {
			router.replace('/login');
		} else if (session && inAuthGroup) {
			router.replace('/(tabs)');
		}
	}, [session, loading, segments]);

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(auth)" />
			<Stack.Screen name="(tabs)" />
			<Stack.Screen name="+not-found" />
		</Stack>
	);
}

export default function RootLayout() {
	useFrameworkReady();

	let [fontsLoaded] = useFonts({
		Quicksand_300Light,
		Quicksand_400Regular,
		Quicksand_500Medium,
		Quicksand_600SemiBold,
		Quicksand_700Bold,
	});

	return (
		<AuthProvider>
			<TourProvider>
				<RootLayoutNav />
				<StatusBar style="auto" />
			</TourProvider>
		</AuthProvider>
	);
}
