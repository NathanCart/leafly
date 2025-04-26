import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Leaf, Calendar, Heart } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { COLORS } from '@/app/constants/colors';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome from '@expo/vector-icons/FontAwesome';
interface QuickActionsProps {
	plantId: string;
	onPress?: (type: string) => void;
}

export const QuickActions = ({ plantId, onPress }: QuickActionsProps) => {
	const router = useRouter();

	const actions = [
		{
			icon: <FontAwesome name="camera" size={30} color={COLORS.primary} />,
			label: 'Progress',
			onPress: () => onPress?.('Camera'),
		},
		{
			icon: <Heart size={30} color={COLORS.primary} fill={COLORS.primary} />,
			label: 'Health',
			onPress: () => router.push({ pathname: '/health', params: { id: plantId } }),
		},
		{
			icon: <FontAwesome5 name="calendar-alt" size={30} color={COLORS.primary} />,
			label: 'Care',
			onPress: () => onPress?.('Schedule'),
		},
	];

	return (
		<View style={styles.actionsRow}>
			{actions.map((action, index) => (
				<TouchableOpacity key={index} style={styles.quickAction} onPress={action.onPress}>
					<View style={styles.iconContainer}>{action.icon}</View>
					<Text style={styles.quickLabel}>{action.label}</Text>
				</TouchableOpacity>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	actionsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 24,
	},
	quickAction: {
		alignItems: 'center',
		width: '31%',
		backgroundColor: COLORS.card.light,
		padding: 24,
		paddingHorizontal: 16,
		borderRadius: 12,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
	},
	iconContainer: {
		width: 58,
		height: 58,
		borderRadius: 28,
		backgroundColor: COLORS.surface.light,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	quickLabel: {
		fontSize: 14,
		fontWeight: '500',
		color: COLORS.text.primary.light,
		textAlign: 'center',
	},
});
