import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInMilliseconds } from 'date-fns';

import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import {
	GoogleSignin,
	GoogleSigninButton,
	statusCodes,
} from '@react-native-google-signin/google-signin';
export function Auth() {
	// Configure Google Sign-In
	GoogleSignin.configure({
		scopes: ['https://www.googleapis.com/auth/drive.readonly'],
		webClientId: '735228876062-t147957uhp7glbfgsa0rb6ob9kuj11nf.apps.googleusercontent.com',
		iosClientId: '',
	});

	// iOS: Apple Sign-In
	if (Platform.OS === 'ios')
		return (
			<AppleAuthentication.AppleAuthenticationButton
				buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
				buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
				cornerRadius={5}
				style={{ width: '100%', height: 48 }}
				onPress={async () => {
					// 4) Show paywall if needed (with “Sale” if user is over a day old)

					try {
						const credential = await AppleAuthentication.signInAsync({
							requestedScopes: [
								AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
								AppleAuthentication.AppleAuthenticationScope.EMAIL,
							],
						});
						// Sign in via Supabase Auth.
						if (credential.identityToken) {
							const {
								error,
								data: { user },
							} = await supabase.auth.signInWithIdToken({
								provider: 'apple',
								token: credential.identityToken,
							});
							console.log(JSON.stringify({ error, user }, null, 2));
							router.push('/');
						} else {
							throw new Error('No identityToken.');
						}
					} catch (e: any) {
						if (e.code === 'ERR_REQUEST_CANCELED') {
							// user canceled the sign-in flow
						} else {
							// handle other errors
						}
					}
				}}
			/>
		);

	// Android: Google Sign-In
	return (
		<GoogleSigninButton
			size={GoogleSigninButton.Size.Wide}
			color={GoogleSigninButton.Color.Light}
			style={{ width: '100%', height: 48 }}
			onPress={async () => {
				try {
					await GoogleSignin.hasPlayServices();
					const userInfo = await GoogleSignin.signIn();

					if (userInfo?.data?.idToken) {
						const { data, error } = await supabase.auth.signInWithIdToken({
							provider: 'google',
							token: userInfo.data.idToken,
						});

						console.log(error, 'error logging in');

						if (!error) {
							router.push('/');
						}
					} else {
						throw new Error('no ID token present!');
					}
				} catch (error: any) {
					console.log(JSON.stringify(error), 'error logging in');
					if (error.code === statusCodes.SIGN_IN_CANCELLED) {
						// user cancelled the login flow
					} else if (error.code === statusCodes.IN_PROGRESS) {
						// operation (e.g. sign in) is in progress already
					} else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
						// play services not available or outdated
					} else {
						// some other error happened
					}
				}
			}}
		/>
	);
}
