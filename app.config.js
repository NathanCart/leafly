// app.config.js
import fs from 'fs';
import path from 'path';
import { ConfigContext, ExpoConfig } from '@expo/config';
import { withDangerousMod, withPlugins } from '@expo/config-plugins';

const writeLocalProperties = (config) =>
	withDangerousMod(config, [
		'android',
		async (config) => {
			const sdkPath =
				process.env.ANDROID_SDK_ROOT ||
				process.env.ANDROID_HOME ||
				path.join(process.env.HOME || '', 'Library/Android/sdk');
			const localProps = `sdk.dir=${sdkPath.replace(/\\/g, '/')}\n`;
			const localPath = path.resolve(
				config.modRequest.projectRoot,
				'android',
				'local.properties'
			);
			fs.writeFileSync(localPath, localProps, { encoding: 'utf8' });
			return config;
		},
	]);

export default ({ config }) => {
	// 1) Start with your base Expo config
	let updated = {
		...config,
		name: 'florai',
		slug: 'florai',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './assets/images/icon.png',
		scheme: 'myapp',
		userInterfaceStyle: 'automatic',
		newArchEnabled: true,
		web: {
			bundler: 'metro',
			output: 'single',
			favicon: './assets/images/favicon.png',
		},
		ios: {
			usesAppleSignIn: true,
			supportsTablet: true,
			bundleIdentifier: 'com.viralreach.florai',
			infoPlist: {
				UIBackgroundModes: ['location', 'fetch', 'remote-notification'],
				ITSAppUsesNonExemptEncryption: false,
				UIViewControllerBasedStatusBarAppearance: false,
				NSLocationWhenInUseUsageDescription:
					'This app requires access to your location when open.',
				NSLocationAlwaysAndWhenInUseUsageDescription:
					'This app requires access to your location even when closed.',
				NSLocationAlwaysUsageDescription:
					'This app requires access to your location when open.',
			},
		},
		android: {
			adaptiveIcon: {
				foregroundImage: './assets/adaptive-icon.png',
				backgroundColor: '#ffffff',
			},
			package: 'com.viralreach.florai',
		},
		experiments: {
			typedRoutes: true,
		},
		extra: {
			router: { origin: false },
			eas: { projectId: '7f15a26e-03da-4a38-8500-eab6a42a9b91' },
		},
		owner: 'nathan-carter',
	};

	// 2) Apply your plugins (including build-properties)
	updated = withPlugins(updated, [
		'expo-router',
		'expo-font',
		'expo-apple-authentication',
		'expo-file-system',
		'@react-native-google-signin/google-signin',
		[
			'expo-build-properties',
			{
				android: {
					compileSdkVersion: 35,
					targetSdkVersion: 34,
					minSdkVersion: 24,
					buildToolsVersion: '35.0.0',
					ndkVersion: '26.1.10909125',
				},
			},
		],
	]);

	// 3) Write local.properties for ANDROID_HOME/ANDROID_SDK_ROOT
	updated = writeLocalProperties(updated);

	return updated;
};
