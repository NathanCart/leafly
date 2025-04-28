import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { TourProvider } from '@/contexts/TourContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Quicksand_300Light } from '@expo-google-fonts/quicksand/300Light';
import { Quicksand_400Regular } from '@expo-google-fonts/quicksand/400Regular';
import { Quicksand_500Medium } from '@expo-google-fonts/quicksand/500Medium';
import { Quicksand_600SemiBold } from '@expo-google-fonts/quicksand/600SemiBold';
import { Quicksand_700Bold } from '@expo-google-fonts/quicksand/700Bold';
import { useFonts } from '@expo-google-fonts/quicksand/useFonts';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';

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
			<GestureHandlerRootView>
				<DatabaseProvider>
					<TourProvider>
						<RootLayoutNav />
						<StatusBar style="auto" />
					</TourProvider>
				</DatabaseProvider>
			</GestureHandlerRootView>
		</AuthProvider>
	);
}
