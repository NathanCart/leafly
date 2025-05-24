import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { TourProvider } from '@/contexts/TourContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useRevenuecat } from '@/hooks/useRevenuecat';
import { Quicksand_300Light } from '@expo-google-fonts/quicksand/300Light';
import { Quicksand_400Regular } from '@expo-google-fonts/quicksand/400Regular';
import { Quicksand_500Medium } from '@expo-google-fonts/quicksand/500Medium';
import { Quicksand_600SemiBold } from '@expo-google-fonts/quicksand/600SemiBold';
import { Quicksand_700Bold } from '@expo-google-fonts/quicksand/700Bold';
import { useFonts } from '@expo-google-fonts/quicksand/useFonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
function LoadingScreen() {
	return (
		<View style={styles.loadingContainer}>
			<ActivityIndicator size="large" />
		</View>
	);
}
function RootLayoutNav() {
	GoogleSignin.configure({
		scopes: ['https://www.googleapis.com/auth/drive.readonly'],
		webClientId: '735228876062-t147957uhp7glbfgsa0rb6ob9kuj11nf.apps.googleusercontent.com',
		iosClientId: '735228876062-3a8p1vcg2oor41sfst425drfn420jvcr.apps.googleusercontent.com',
	});

	const { session, loading: authLoading } = useAuth();

	const segments = useSegments();
	const router = useRouter();
	const { initializeRevenueCat } = useRevenuecat();

	// ── track onboarding lookup ────────────────────────────────────────────
	const [onboardingChecked, setOnboardingChecked] = useState(false);
	const [onboardingCompleted, setOnboardingCompleted] = useState(false);

	useEffect(() => {
		initializeRevenueCat();
		AsyncStorage.getItem('onboarding_completed')
			.then((val) => setOnboardingCompleted(val === 'true'))
			.catch(() => setOnboardingCompleted(false))
			.finally(() => setOnboardingChecked(true));
	}, []);

	console.log('onboardingChecked', onboardingChecked);

	useEffect(() => {
		if (authLoading || !onboardingChecked) return;

		const inAuthGroup = segments[0] === '(auth)';
		console.log(!session);
		console.log(segments, 'segments data');
		const inOnboardingGroup = segments[0] === '(onboarding)';

		(async () => {
			if (!onboardingCompleted && !inOnboardingGroup && !segments?.length) {
				console.log('onboarding not completed');
				router.replace('/(onboarding)/get-started');
			} else {
				if (!session && !inAuthGroup && !!onboardingCompleted) {
					console.log('user not logged in');
					router.replace('/login');
				} else if (session && (inAuthGroup || !segments?.length)) {
					console.log('user logged in');
					router.replace('/(tabs)');
				}
			}
		})();
	}, [session, authLoading, segments, onboardingChecked, onboardingCompleted]);

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen
				name="(auth)"
				options={{
					animation: 'fade',
				}}
			/>
			<Stack.Screen
				name="(tabs)"
				options={{
					animation: 'fade',
				}}
			/>
			<Stack.Screen
				name="(onboarding)"
				options={{
					animation: 'fade',
				}}
			/>
			<Stack.Screen
				name="+not-found"
				options={{
					animation: 'fade',
				}}
			/>
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

	useEffect(() => {
		(async () => {
			const installedDate = await AsyncStorage.getItem('installed_date');
			const installUUID = await AsyncStorage.getItem('install_uuid');

			if (!installUUID?.length) {
				const uniqueId = uuidv4(); // ⇨ '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'

				// If the app is opened for the first time, set the install UUID
				await AsyncStorage.setItem('install_uuid', uniqueId);
			}
			if (!installedDate?.length) {
				// If the app is opened for the first time, set the installed date
				await AsyncStorage.setItem('installed_date', new Date().toString());
			}
		})();
	}, []);

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
const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
