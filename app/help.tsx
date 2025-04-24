import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Mail, Globe, MessageCircle, Book } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from './constants/colors';
import { Text } from '@/components/Text';

const HELP_SECTIONS = [
	{
		title: 'Contact Support',
		icon: <MessageCircle size={24} color={COLORS.primary} />,
		items: [
			{
				title: 'Email Support',
				action: () => Linking.openURL('mailto:viralreachltd@gmail.com'),
			},
			// {
			// 	title: 'Visit Help Center',
			// 	action: () => Linking.openURL('https://help.example.com'),
			// },
		],
	},
];

export default function HelpScreen() {
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.container, { paddingTop: insets.top }]}>
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
					<ChevronLeft size={24} color={COLORS.text.primary.light} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Help & Support</Text>
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{HELP_SECTIONS.map((section, sectionIndex) => (
					<View key={section.title} style={styles.section}>
						<View style={styles.sectionHeader}>
							{section.icon}
							<Text style={styles.sectionTitle}>{section.title}</Text>
						</View>

						{section.items.map((item, itemIndex) => (
							<TouchableOpacity
								key={item.title}
								style={styles.item}
								onPress={() =>
									item.action ? item.action() : Linking.openURL(item.link!)
								}
							>
								<Text style={styles.itemTitle}>{item.title}</Text>
								<ChevronLeft
									size={20}
									color={COLORS.text.secondary.light}
									style={{ transform: [{ rotate: '180deg' }] }}
								/>
							</TouchableOpacity>
						))}
					</View>
				))}
			</ScrollView>
			<View style={styles.contactSection}>
				<Text style={styles.contactTitle}>Need more help?</Text>
				<Text style={styles.contactText}>
					Our support team is available Monday through Friday, 9am-5pm EST.
				</Text>
				<TouchableOpacity
					style={styles.contactButton}
					onPress={() => Linking.openURL('mailto:viralreachltd@gmail.com')}
				>
					<Mail size={20} color={COLORS.primary} />
					<Text style={styles.contactButtonText}>Contact Support</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	backButton: {
		padding: 8,
		marginRight: 8,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: COLORS.text.primary.light,
	},
	content: {
		flex: 1,
		padding: 16,
	},
	section: {
		marginBottom: 24,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
		gap: 12,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: COLORS.text.primary.light,
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 16,
		paddingHorizontal: 12,
		backgroundColor: '#fff',
		borderRadius: 12,
		marginBottom: 8,
		borderWidth: 2,
		borderColor: COLORS.border,
	},
	itemTitle: {
		fontSize: 16,
		color: COLORS.text.primary.light,
	},
	contactSection: {
		padding: 24,
		backgroundColor: COLORS.surface.light,
		borderRadius: 16,
		alignItems: 'center',
		marginTop: 8,
		marginBottom: 32,
	},
	contactTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: COLORS.text.primary.light,
		marginBottom: 8,
	},
	contactText: {
		fontSize: 14,
		color: COLORS.text.secondary.light,
		textAlign: 'center',
		marginBottom: 16,
	},
	contactButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#E6F2E8',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 25,
		gap: 8,
	},
	contactButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: COLORS.primary,
	},
});
