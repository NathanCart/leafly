// File: components/Tour/TourHighlight.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import RNModal from 'react-native-modal';
import { Text } from '@/components/Text';
import { COLORS } from '@/app/constants/colors';

interface TourHighlightProps {
	/** Whether the sheet is visible */
	visible: boolean;
	/** Position of the sheet: top or bottom */
	position?: 'top' | 'bottom';
	/** Heading text */
	title: string;
	/** Description text */
	description: string;
	/** Handler for "Got it" button tap */
	onNext: () => void;
}

/**
 * A non-dismissible tour highlight sheet aligned at the top or bottom.
 */
export function TourHighlight({
	visible,
	position = 'bottom',
	title,
	description,
	onNext,
}: TourHighlightProps) {
	const justifyContent = position === 'top' ? 'flex-start' : 'flex-end';

	return (
		<RNModal
			isVisible={visible}
			style={[{ margin: 0, justifyContent }]}
			backdropTransitionOutTiming={0}
			propagateSwipe
			// no onBackdropPress / onBackButtonPress / swipeDirection
		>
			<View style={styles.sheet}>
				<View style={styles.handle} />

				<Text style={styles.title}>{title}</Text>
				<Text style={styles.description}>{description}</Text>

				<TouchableOpacity style={styles.button} onPress={onNext}>
					<Text style={styles.buttonText}>Got it</Text>
				</TouchableOpacity>
			</View>
		</RNModal>
	);
}

const styles = StyleSheet.create({
	sheet: {
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingHorizontal: 24,
		paddingTop: 12,
		paddingBottom: 32,
		backgroundColor: 'rgba(255,255,255,0.98)',
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.15,
				shadowRadius: 8,
			},
			android: { elevation: 4 },
		}),
	},
	handle: {
		alignSelf: 'center',
		width: 44,
		height: 5,
		borderRadius: 3,
		backgroundColor: 'rgba(0,0,0,0.2)',
		marginBottom: 16,
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: COLORS.text.primary.light,
		textAlign: 'center',
		marginBottom: 8,
	},
	description: {
		fontSize: 16,
		color: COLORS.text.secondary.light,
		textAlign: 'center',
		marginBottom: 24,
		lineHeight: 24,
	},
	button: {
		alignSelf: 'center',
		backgroundColor: COLORS.primary,
		paddingHorizontal: 32,
		paddingVertical: 14,
		borderRadius: 28,
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
});
