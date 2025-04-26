import React, { useState, useRef } from 'react';
import {
	View,
	StyleSheet,
	TouchableOpacity,
	Animated,
	Image,
	ScrollView, // ← kept in case you already used it elsewhere
} from 'react-native';
import { ChevronDown, AlertTriangle, CheckCircle2 } from 'lucide-react-native';

import { Text } from '@/components/Text';
import { COLORS } from '@/app/constants/colors';
import { usePlantHealth } from '@/hooks/usePlantHealth';
import { Database } from '@/types/supabase';

/* ────────────────────────────────────────────────────────── */

interface HealthHistorySectionProps {
	plantId: string;
}

export const HealthHistorySection = ({ plantId }: HealthHistorySectionProps) => {
	const [expanded, setExpanded] = useState(false);
	const animation = useRef(new Animated.Value(0)).current;

	const { healthReports } = usePlantHealth(plantId);

	const toggleExpanded = () => {
		setExpanded(!expanded);
		Animated.spring(animation, {
			toValue: expanded ? 0 : 1,
			useNativeDriver: true,
			friction: 7,
		}).start();
	};

	const rotate = animation.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '180deg'],
	});

	return (
		<View style={styles.container}>
			{/* ───────── Header row ───────── */}
			<View style={styles.headerRow}>
				<Text style={styles.sectionTitle}>Health Check History</Text>

				<TouchableOpacity onPress={toggleExpanded} style={styles.expandButton}>
					<Text style={styles.expandText}>{expanded ? 'Show Less' : 'Show All'}</Text>
					<Animated.View style={{ transform: [{ rotate }] }}>
						<ChevronDown color={COLORS.primary} size={20} />
					</Animated.View>
				</TouchableOpacity>
			</View>

			{/* ───────── Empty state / list ───────── */}
			{healthReports.length === 0 ? (
				<View style={styles.emptyState}>
					<Text style={styles.emptyText}>No health checks yet</Text>
				</View>
			) : (
				<>
					{/* Always show the latest health check */}
					<HealthCheckItem healthCheck={healthReports[0]} />

					{/* Show more if expanded */}
					{expanded &&
						healthReports.length > 1 &&
						healthReports
							.slice(1)
							.map((check) => <HealthCheckItem key={check.id} healthCheck={check} />)}
				</>
			)}
		</View>
	);
};

/* ──────────────────────────────────────────────────────────
            •••  Single card (matches CareSchedule)  •••
   ────────────────────────────────────────────────────────── */

const HealthCheckItem = ({
	healthCheck,
}: {
	healthCheck: Database['public']['Tables']['plant_health_reports']['Row'];
}) => {
	/* —— 1. Helpers ——————————————————————— */
	const getStatusFromProbability = (p: number) =>
		p > 0.7 ? 'healthy' : p > 0.5 ? 'warning' : 'critical';

	const status = getStatusFromProbability(healthCheck?.raw?.result?.is_healthy?.probability ?? 0);
	const statusColors = getStatusColors(status);

	// diseases with probability ≥ 20 %
	const significantDiseases =
		healthCheck?.raw?.result?.disease?.suggestions.filter((d) => d.probability >= 0.2) ?? [];

	const formattedDate = new Date(healthCheck.created_at).toLocaleDateString('en-US', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	});

	/* —— 2. Render ———————————————————————— */
	return (
		<View style={styles.card}>
			{/* image (shadow supplied by COLORS.shadowLg just like CareSchedule) */}
			<View style={COLORS.shadowLg}>
				<Image
					source={{ uri: healthCheck.image_url }}
					style={styles.reportImage}
					resizeMode="cover"
				/>
			</View>

			{/* textual content */}
			<View style={styles.cardContent}>
				{/* row 1: title + icon bubble */}
				<View style={styles.cardHeader}>
					<Text style={styles.cardTitle}>Health Check</Text>

					<View
						style={[
							styles.cardIcon,
							{ backgroundColor: statusColors.color + '10' /* 10 % alpha */ },
						]}
					>
						{getStatusIcon(status)}
					</View>
				</View>

				{/* row 2: status word + date */}
				<View style={styles.cardRow}>
					<Text style={[styles.cardType, { color: statusColors.color }]}>
						{status.charAt(0).toUpperCase() + status.slice(1)}
					</Text>
					<Text style={styles.cardDate}>{formattedDate}</Text>
				</View>

				{/* row 3: issues / “no issues” */}
				{significantDiseases.length ? (
					<View style={styles.issuesList}>
						{significantDiseases.map((issue, i) => (
							<Text key={i} style={styles.issueItem}>
								• {issue.name}
							</Text>
						))}
					</View>
				) : (
					<Text style={styles.issueItem}>No significant issues detected</Text>
				)}
			</View>
		</View>
	);
};

/* ──────────────────────────────────────────────────────────
                                Utilities
   ────────────────────────────────────────────────────────── */

const getStatusColors = (status: string) => {
	switch (status) {
		case 'healthy':
			return { bg: '#E6F4EA', color: '#34A853' };
		case 'warning':
			return { bg: '#FEF7E0', color: '#FBBC05' };
		case 'critical':
			return { bg: '#FCE8E6', color: '#EA4335' };
		default:
			return { bg: '#E6F4EA', color: '#34A853' };
	}
};

const getStatusIcon = (status: string) =>
	status === 'healthy' ? (
		<CheckCircle2 size={16} color="#34A853" />
	) : (
		<AlertTriangle
			size={16}
			color={status === 'warning' ? '#FBBC05' : '#EA4335'}
			fill="transparent"
		/>
	);

/* ──────────────────────────────────────────────────────────
                                Styles
   ────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
	/* —— wrapper —— */
	container: {
		marginBottom: 24,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: COLORS.text.primary.light,
	},
	expandButton: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	expandText: {
		fontSize: 14,
		fontWeight: '500',
		color: COLORS.primary,
		marginRight: 4,
	},
	emptyState: {
		padding: 24,
		backgroundColor: COLORS.card.light,
		borderRadius: 12,
		alignItems: 'center',
	},
	emptyText: {
		color: COLORS.text.secondary.light,
		fontSize: 16,
	},

	/* —— card (mirrors CareSchedule) —— */
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF',
		padding: 12,
		marginBottom: 12,
		borderBottomWidth: 2,
		borderColor: COLORS.border,
	},
	reportImage: {
		width: 56,
		height: 56,
		borderRadius: 14,
		marginRight: 12,
	},
	cardContent: {
		flex: 1,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	cardIcon: {
		width: 28,
		height: 28,
		borderRadius: 14,
		justifyContent: 'center',
		alignItems: 'center',
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111827',
	},
	cardRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	cardType: {
		fontSize: 14,
		fontWeight: '500',
	},
	cardDate: {
		fontSize: 14,
		color: '#6B7280',
	},

	/* issues list */
	issuesList: {
		marginTop: 6,
	},
	issueItem: {
		fontSize: 14,
		color: COLORS.text.secondary.light,
	},
});
