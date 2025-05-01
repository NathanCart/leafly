import { Platform } from 'react-native';

// App-wide color scheme
export const COLORS = {
	// Primary Colors
	shadow: {
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.1,
				shadowRadius: 2,
			},
			android: {
				elevation: 2,
			},
		}),
	},
	shadowLg: {
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 1, height: 2 },
				shadowOpacity: 0.3,
				shadowRadius: 2,
			},
			android: {
				elevation: 2,
			},
		}),
	},
	primary: '#58CC02', // Main green
	muted: '#606C38', // Muted green
	secondary: '#89E219', // Light green
	tertiary: '#1CB0F6', // Accent blue
	button: {
		primary: '#58CC02',
		primaryBorder: '#58A700',
		secondary: '#FFC800',
		secondaryBorder: '#E6AC00',
		tertiary: '#ECECEC',
		tertiaryBorder: '#DADADA',
		danger: '#FF4B4B',
		dangerBorder: '#EA2B2B',
		disabled: '#E5E5E5',
		disabledBorder: '#CECECE',
	},
	// Background Colors
	background: {
		light: '#FFFFFF',
		dark: '#111111',
	},
	title: '#1D1D1D',
	titleMd: { fontSize: 20, fontWeight: '700' as any },
	surface: {
		light: '#fff',
		dark: '#1A1A1A',
	},
	card: {
		light: '#FFFFFF',
		dark: '#222222',
	},

	// Text Colors
	text: {
		primary: {
			light: '#1D1D1D',
			dark: '#FFFFFF',
		},
		secondary: {
			light: '#757575',
			dark: '#BBBBBB',
		},
	},

	// Status Colors
	success: '#58CC02',
	warning: '#FFC800',
	error: '#FF4B4B',
	info: '#1CB0F6',

	border: '#f1f3f7',
	// Tab Bar
	tabBar: {
		active: '#58CC02',
		inactive: '#AFAFAF',
		background: {
			light: '#FFFFFF',
			dark: '#1A1A1A',
		},
	},
};
