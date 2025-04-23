import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Droplet, Wind, Scaling as Seedling, Calendar } from 'lucide-react-native';
import { Text } from '@/components/Text';

interface PlantCardProps {
	name: string;
	action: string;
	due: string;
	image: string;
	isDark: boolean;
	onPress: () => void;
}

export function PlantCard({ name, action, due, image, isDark, onPress }: PlantCardProps) {
	// Determine action icon and color
	const getActionIcon = () => {
		switch (action.toLowerCase()) {
			case 'water':
				return <Droplet size={20} color="#33A1FF" />;
			case 'mist':
				return <Wind size={20} color="#88CCFF" />;
			case 'fertilize':
				return <Seedling size={20} color="#3A8349" />;
			default:
				return <Calendar size={20} color="#3A8349" />;
		}
	};

	return (
		<TouchableOpacity
			style={[styles.card, { backgroundColor: isDark ? '#2A3A30' : '#FFFFFF' }]}
			onPress={onPress}
		>
			<Image source={{ uri: image }} style={styles.image} />

			<View style={styles.contentContainer}>
				<Text style={[styles.name, { color: isDark ? '#E0E0E0' : '#283618' }]}>{name}</Text>

				<View style={styles.actionContainer}>
					<View
						style={[
							styles.iconContainer,
							{ backgroundColor: isDark ? '#1A2A20' : '#E6F2E8' },
						]}
					>
						{getActionIcon()}
					</View>

					<View style={styles.actionTextContainer}>
						<Text style={[styles.action, { color: isDark ? '#E0E0E0' : '#283618' }]}>
							{action}
						</Text>
						<Text style={[styles.due, { color: isDark ? '#BBBBBB' : '#555555' }]}>
							{due}
						</Text>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: 'row',
		borderRadius: 12,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	image: {
		width: 80,
		height: 80,
	},
	contentContainer: {
		flex: 1,
		padding: 12,
		justifyContent: 'space-between',
	},
	name: {
		fontSize: 16,
		fontWeight: '600',
	},
	actionContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
	},
	iconContainer: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 10,
	},
	actionTextContainer: {
		flex: 1,
	},
	action: {
		fontSize: 14,
		fontWeight: '500',
	},
	due: {
		fontSize: 12,
	},
});
