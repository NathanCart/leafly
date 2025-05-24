import { Alert, Platform } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import Purchases from 'react-native-purchases';
import { UIManager } from 'react-native';

export function useRevenuecat(
	{ offering }: { offering?: 'default' } = {
		offering: 'default',
	}
) {
	async function initializeRevenueCat() {
		// Initialize RevenueCat with your API key

		if (Platform.OS === 'ios') {
			// if (!process.env.EXPO_PUBLIC_RC_IOS) {
			// 	Alert.alert('Error', 'Please set the EXPO_PUBLIC_RC_IOS environment variable');
			// }
			// if (!process.env.EXPO_PUBLIC_RC_ANDROID) {
			// 	Alert.alert('Error', 'Please set the EXPO_PUBLIC_RC_ANDROID environment variable');
			// }
			// Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_IOS! });
			Purchases.configure({ apiKey: 'appl_QXMgukHPddOQtisYCWRFHMXpufg' });
		} else if (Platform.OS === 'android') {
			// console.log('Android Purchases', process.env.EXPO_PUBLIC_RC_ANDROID);
			// Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_ANDROID! });
		}

		if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
			UIManager.setLayoutAnimationEnabledExperimental(true);
		}
	}

	async function presentPaywallIfNeeded() {
		// If you need to present a specific offering:
		const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
			requiredEntitlementIdentifier: 'pro',
			offering: {
				identifier: offering, // Replace with your offering identifier
			} as any,
		});

		return paywallResult;
	}

	async function isSubscribed() {
		try {
			const purchaserInfo = await Purchases.getCustomerInfo();
			return purchaserInfo.entitlements.active['pro'] !== undefined;
		} catch (error) {
			console.error('Error checking subscription status:', error);
			return false;
		}
	}

	/** Gate a premium action and return true if the user is allowed. */
	async function requireProChat(sendChat: (t: string) => void, delay = 1500) {
		if (await isSubscribed()) return true;

		sendChat('🌿 That’s a sprout-level feature for Plant Pros! Ready to unlock it?');
		await new Promise((r) => setTimeout(r, delay));

		const res = await presentPaywallIfNeeded();
		return res === PAYWALL_RESULT.PURCHASED || (await isSubscribed());
	}

	async function proAction(action: () => void) {
		const isSubscribed = await useRevenuecat().isSubscribed();
		if (!isSubscribed) {
			await presentPaywallIfNeeded();
		} else {
			action();
		}
	}

	return {
		presentPaywallIfNeeded,
		initializeRevenueCat,
		isSubscribed,
		requireProChat,
		proAction,
	};
}
